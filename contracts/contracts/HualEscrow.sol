// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HualEscrow
 * @notice Onchain USDC escrow engine for Hual commerce.
 * Payment is held securely until the customer verifies physical pickup or confirms item delivery.
 */
contract HualEscrow is Ownable {
    using SafeERC20 for IERC20;

    enum EscrowStatus {
        HELD,       // 0: Deposited and locked in escrow
        RELEASED,   // 1: Confirmed handover, released to merchant
        REFUNDED    // 2: Cancelled or returned, refunded to buyer
    }

    struct EscrowOrder {
        uint256 orderId;
        address buyer;
        address merchant;
        uint256 amountUsdc; // 6 decimals (e.g. 250_000_000 = 250.00 USDC)
        uint256 passportTokenId;
        bool isPickup;
        EscrowStatus status;
        uint256 createdAt;
        uint256 settledAt;
    }

    IERC20 public immutable usdcToken;
    address public commerceContract;

    // Mapping from orderId to EscrowOrder
    mapping(uint256 => EscrowOrder) public orders;
    uint256[] public allOrderIds;

    event EscrowDeposited(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed merchant,
        uint256 amountUsdc,
        uint256 passportTokenId,
        bool isPickup
    );

    event EscrowReleased(
        uint256 indexed orderId,
        address indexed merchant,
        uint256 amountUsdc,
        uint256 timestamp
    );

    event EscrowRefunded(
        uint256 indexed orderId,
        address indexed buyer,
        uint256 amountUsdc,
        uint256 timestamp
    );

    modifier onlyCommerce() {
        require(msg.sender == commerceContract || msg.sender == owner(), "HualEscrow: Unauthorized caller");
        _;
    }

    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcToken);
    }

    function setCommerceContract(address _commerce) external onlyOwner {
        require(_commerce != address(0), "Invalid commerce address");
        commerceContract = _commerce;
    }

    /**
     * @notice Deposit customer payment into escrow upon order creation.
     */
    function deposit(
        uint256 orderId,
        address buyer,
        address merchant,
        uint256 amountUsdc,
        uint256 passportTokenId,
        bool isPickup
    ) external onlyCommerce {
        require(orders[orderId].amountUsdc == 0, "HualEscrow: Order already exists");
        require(amountUsdc > 0, "HualEscrow: Amount must be > 0");

        orders[orderId] = EscrowOrder({
            orderId: orderId,
            buyer: buyer,
            merchant: merchant,
            amountUsdc: amountUsdc,
            passportTokenId: passportTokenId,
            isPickup: isPickup,
            status: EscrowStatus.HELD,
            createdAt: block.timestamp,
            settledAt: 0
        });

        allOrderIds.push(orderId);

        emit EscrowDeposited(orderId, buyer, merchant, amountUsdc, passportTokenId, isPickup);
    }

    /**
     * @notice Release escrow funds to merchant upon verified handover or delivery confirmation.
     */
    function releaseToMerchant(uint256 orderId) external onlyCommerce {
        EscrowOrder storage order = orders[orderId];
        require(order.status == EscrowStatus.HELD, "HualEscrow: Order not in held status");

        order.status = EscrowStatus.RELEASED;
        order.settledAt = block.timestamp;

        usdcToken.safeTransfer(order.merchant, order.amountUsdc);

        emit EscrowReleased(orderId, order.merchant, order.amountUsdc, block.timestamp);
    }

    /**
     * @notice Refund escrow funds back to buyer upon order cancellation or approved return.
     */
    function refundToBuyer(uint256 orderId) external onlyCommerce {
        EscrowOrder storage order = orders[orderId];
        require(order.status == EscrowStatus.HELD, "HualEscrow: Order not in held status");

        order.status = EscrowStatus.REFUNDED;
        order.settledAt = block.timestamp;

        usdcToken.safeTransfer(order.buyer, order.amountUsdc);

        emit EscrowRefunded(orderId, order.buyer, order.amountUsdc, block.timestamp);
    }

    /**
     * @notice Get order details.
     */
    function getOrder(uint256 orderId) external view returns (EscrowOrder memory) {
        return orders[orderId];
    }

    function totalOrders() external view returns (uint256) {
        return allOrderIds.length;
    }
}
