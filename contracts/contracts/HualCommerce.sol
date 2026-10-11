// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./HualPassport.sol";
import "./HualEscrow.sol";

/**
 * @title HualCommerce
 * @notice Central commerce router coordinating merchant inventory, escrow deposits,
 * in-store PIN verification, customer delivery confirmations, and living passport minting.
 */
contract HualCommerce is Ownable {
    using SafeERC20 for IERC20;

    struct Product {
        uint256 productId;
        string name;
        string brand;
        string category;
        string imageUri;
        string description;
        uint256 priceUsdCents; // e.g. 25000 = $250.00
        uint256 warrantyDurationSeconds;
        uint256 stock;
        address merchant;
        bool allowsPickup;
        bool allowsDelivery;
        bool active;
    }

    struct OrderInfo {
        uint256 orderId;
        uint256 productId;
        uint256 tokenId;
        address buyer;
        address merchant;
        uint256 amountUsdc;
        bool isPickup;
    }

    IERC20 public immutable usdcToken;
    HualPassport public immutable passportContract;
    HualEscrow public immutable escrowContract;

    uint256 private _nextProductId;
    uint256 private _nextOrderId;

    // Mapping from productId to Product
    mapping(uint256 => Product) public products;
    uint256[] public allProductIds;

    // Mapping from orderId to OrderInfo
    mapping(uint256 => OrderInfo) public orders;

    // Authorized relayers for gasless meta-transactions
    mapping(address => bool) public authorizedRelayers;

    event ProductListed(
        uint256 indexed productId,
        address indexed merchant,
        string name,
        uint256 priceUsdCents,
        uint256 stock
    );

    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed productId,
        uint256 indexed tokenId,
        address buyer,
        address merchant,
        uint256 amountUsdc,
        bool isPickup
    );

    event OrderReadyForPickup(uint256 indexed orderId, uint256 indexed tokenId);
    event OrderDispatched(uint256 indexed orderId, uint256 indexed tokenId);
    event OrderCompleted(uint256 indexed orderId, uint256 indexed tokenId, address merchant, uint256 amountUsdc);
    event OrderRefunded(uint256 indexed orderId, uint256 indexed tokenId, address buyer, uint256 amountUsdc);

    modifier onlyRelayerOrOwner() {
        require(authorizedRelayers[msg.sender] || msg.sender == owner(), "HualCommerce: Unauthorized relayer");
        _;
    }

    constructor(
        address _usdcToken,
        address _passportContract,
        address _escrowContract
    ) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC");
        require(_passportContract != address(0), "Invalid passport");
        require(_escrowContract != address(0), "Invalid escrow");

        usdcToken = IERC20(_usdcToken);
        passportContract = HualPassport(_passportContract);
        escrowContract = HualEscrow(_escrowContract);

        authorizedRelayers[msg.sender] = true;
    }

    function setAuthorizedRelayer(address relayer, bool authorized) external onlyOwner {
        authorizedRelayers[relayer] = authorized;
    }

    /**
     * @notice List a real product onchain in the Hual decentralized catalog.
     */
    function listProduct(
        string memory name,
        string memory brand,
        string memory category,
        string memory imageUri,
        string memory description,
        uint256 priceUsdCents,
        uint256 warrantyDurationSeconds,
        uint256 stock,
        bool allowsPickup,
        bool allowsDelivery
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(stock > 0, "Stock must be > 0");

        uint256 productId = ++_nextProductId;
        products[productId] = Product({
            productId: productId,
            name: name,
            brand: brand,
            category: category,
            imageUri: imageUri,
            description: description,
            priceUsdCents: priceUsdCents,
            warrantyDurationSeconds: warrantyDurationSeconds,
            stock: stock,
            merchant: msg.sender,
            allowsPickup: allowsPickup,
            allowsDelivery: allowsDelivery,
            active: true
        });

        allProductIds.push(productId);

        emit ProductListed(productId, msg.sender, name, priceUsdCents, stock);
        return productId;
    }

    /**
     * @notice Get all active products currently in stock.
     */
    function getAllActiveProducts() external view returns (Product[] memory) {
        uint256 total = allProductIds.length;
        uint256 activeCount = 0;
        for (uint256 i = 0; i < total; i++) {
            if (products[allProductIds[i]].active && products[allProductIds[i]].stock > 0) {
                activeCount++;
            }
        }

        Product[] memory activeList = new Product[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < total; i++) {
            uint256 pid = allProductIds[i];
            if (products[pid].active && products[pid].stock > 0) {
                activeList[idx] = products[pid];
                idx++;
            }
        }
        return activeList;
    }

    /**
     * @notice Create an order: buyer pays in USDC -> deposited in Escrow -> mints living Passport.
     * Can be called directly by buyer or sponsored via authorized relayer.
     */
    function createOrder(
        uint256 productId,
        address buyer,
        bool isPickup,
        bytes32 pickupSecretHash,
        string memory serialNumber,
        string memory tokenURI
    ) external returns (uint256 orderId, uint256 tokenId) {
        require(buyer != address(0), "Invalid buyer");
        require(msg.sender == buyer || authorizedRelayers[msg.sender], "Unauthorized caller");

        Product storage prod = products[productId];
        require(prod.active, "Product not active");
        require(prod.stock > 0, "Out of stock");
        if (isPickup) {
            require(prod.allowsPickup, "Pickup not offered for this product");
        } else {
            require(prod.allowsDelivery, "Delivery not offered for this product");
        }

        prod.stock -= 1;

        // USDC has 6 decimals. 1 USD Cent = 10,000 units of USDC.
        uint256 amountUsdc = prod.priceUsdCents * 10_000;

        // Transfer USDC to HualEscrow
        if (msg.sender == buyer || usdcToken.allowance(buyer, address(this)) >= amountUsdc) {
            usdcToken.safeTransferFrom(buyer, address(escrowContract), amountUsdc);
        } else {
            // Sponsored gasless transaction: relayer funds escrow deposit directly on behalf of buyer
            usdcToken.safeTransferFrom(msg.sender, address(escrowContract), amountUsdc);
        }

        orderId = ++_nextOrderId;

        bytes32 paymentTxRef = keccak256(
            abi.encodePacked("HUAL_ORDER", orderId, buyer, block.timestamp)
        );

        // Mint HualPassport with PAID state to the buyer
        tokenId = passportContract.mintPassport(
            buyer,
            productId,
            prod.name,
            prod.brand,
            serialNumber,
            prod.merchant,
            prod.priceUsdCents,
            prod.warrantyDurationSeconds,
            pickupSecretHash,
            paymentTxRef,
            tokenURI
        );

        // Deposit into Escrow
        escrowContract.deposit(orderId, buyer, prod.merchant, amountUsdc, tokenId, isPickup);

        orders[orderId] = OrderInfo({
            orderId: orderId,
            productId: productId,
            tokenId: tokenId,
            buyer: buyer,
            merchant: prod.merchant,
            amountUsdc: amountUsdc,
            isPickup: isPickup
        });

        emit OrderCreated(orderId, productId, tokenId, buyer, prod.merchant, amountUsdc, isPickup);
    }

    /**
     * @notice Merchant marks pickup order packaged and ready at counter.
     */
    function markOrderReady(uint256 orderId) external {
        OrderInfo storage ord = orders[orderId];
        require(msg.sender == ord.merchant || authorizedRelayers[msg.sender], "Unauthorized merchant");

        passportContract.updateState(
            ord.tokenId,
            HualPassport.LifecycleState.READY_FOR_PICKUP,
            msg.sender,
            "Order packaged & ready for pickup at merchant counter"
        );

        emit OrderReadyForPickup(orderId, ord.tokenId);
    }

    /**
     * @notice Merchant marks delivery order dispatched into transit.
     */
    function dispatchDelivery(uint256 orderId) external {
        OrderInfo storage ord = orders[orderId];
        require(!ord.isPickup, "Order is in-store pickup");
        require(msg.sender == ord.merchant || authorizedRelayers[msg.sender], "Unauthorized merchant");

        passportContract.updateState(
            ord.tokenId,
            HualPassport.LifecycleState.IN_TRANSIT,
            msg.sender,
            "Dispatched with shipping carrier"
        );

        emit OrderDispatched(orderId, ord.tokenId);
    }

    /**
     * @notice Merchant completes in-store pickup by submitting customer PIN.
     * Verifies cryptographic secret, releases escrowed USDC to merchant, and marks passport COLLECTED.
     */
    function completePickupHandover(uint256 orderId, string calldata plainPIN) external {
        OrderInfo storage ord = orders[orderId];
        require(ord.isPickup, "Order is delivery, not pickup");
        require(msg.sender == ord.merchant || authorizedRelayers[msg.sender], "Unauthorized merchant");

        // Verify PIN on passport
        bool pinValid = passportContract.verifyPickupSecret(ord.tokenId, plainPIN);
        require(pinValid, "HualCommerce: Invalid customer pickup PIN");

        // 1. Release escrow to merchant
        escrowContract.releaseToMerchant(orderId);

        // 2. Update passport state to COLLECTED
        passportContract.updateState(
            ord.tokenId,
            HualPassport.LifecycleState.COLLECTED,
            msg.sender,
            "Physical item verified via secret PIN & handed over"
        );

        emit OrderCompleted(orderId, ord.tokenId, ord.merchant, ord.amountUsdc);
    }

    /**
     * @notice Customer confirms receipt of delivered item.
     * Releases escrowed USDC to merchant and marks passport COLLECTED.
     */
    function confirmDelivery(uint256 orderId) external {
        OrderInfo storage ord = orders[orderId];
        require(!ord.isPickup, "Order is pickup, use handover verifier");
        require(msg.sender == ord.buyer || authorizedRelayers[msg.sender], "Unauthorized buyer");

        // 1. Release escrow to merchant
        escrowContract.releaseToMerchant(orderId);

        // 2. Update passport state to COLLECTED
        passportContract.updateState(
            ord.tokenId,
            HualPassport.LifecycleState.COLLECTED,
            ord.buyer,
            "Delivery verified & accepted by customer"
        );

        emit OrderCompleted(orderId, ord.tokenId, ord.merchant, ord.amountUsdc);
    }

    /**
     * @notice Cancel order before handover/dispatch, returning USDC from escrow to buyer.
     */
    function cancelAndRefundOrder(uint256 orderId) external {
        OrderInfo storage ord = orders[orderId];
        require(
            msg.sender == ord.merchant || msg.sender == ord.buyer || authorizedRelayers[msg.sender],
            "Unauthorized cancellation"
        );

        // Refund escrow to buyer
        escrowContract.refundToBuyer(orderId);

        // Restore product stock
        products[ord.productId].stock += 1;

        // Update passport to REFUNDED
        passportContract.updateState(
            ord.tokenId,
            HualPassport.LifecycleState.REFUNDED,
            msg.sender,
            "Order cancelled & refunded to customer"
        );

        emit OrderRefunded(orderId, ord.tokenId, ord.buyer, ord.amountUsdc);
    }

    function totalProducts() external view returns (uint256) {
        return allProductIds.length;
    }

    function totalOrders() external view returns (uint256) {
        return _nextOrderId;
    }
}
