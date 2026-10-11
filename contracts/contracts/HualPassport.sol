// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HualPassport
 * @notice Verifiable living Product Passport on Monad.
 * Follows the physical product through its entire lifecycle:
 * Discover -> Buy -> Pay -> Collect -> Own -> Warranty -> Transfer -> Resell
 */
contract HualPassport is ERC721URIStorage, Ownable {
    enum LifecycleState {
        ORDERED,              // 0: Order created
        PAID,                 // 1: Payment deposited in escrow
        READY_FOR_PICKUP,     // 2: Packaged at merchant counter
        IN_TRANSIT,           // 3: Dispatched for customer delivery
        COLLECTED,            // 4: Physical handover completed; escrow settled
        ACTIVE_OWNERSHIP,     // 5: In customer possession with active warranty
        UNDER_SERVICE,        // 6: Warranty claim or repair in progress
        TRANSFERRED,          // 7: Secondary ownership transfer
        REFUNDED              // 8: Cancelled / returned and refunded
    }

    struct PassportData {
        uint256 tokenId;
        uint256 productId;
        string productName;
        string productBrand;
        string serialNumber;
        address originalMerchant;
        uint256 originalPriceUsdCents; // e.g. 25000 = $250.00
        uint256 purchaseTimestamp;
        uint256 warrantyDurationSeconds;
        uint256 warrantyExpiresAt;
        LifecycleState currentState;
        bytes32 paymentTxRef;
        bytes32 pickupSecretHash;
        uint256 transferCount;
    }

    struct LifecycleEvent {
        LifecycleState state;
        address actor;
        uint256 timestamp;
        string note;
        bytes32 txHash;
    }

    uint256 private _nextTokenId;

    // Mapping from tokenId to PassportData
    mapping(uint256 => PassportData) public passports;
    uint256[] public allTokenIds;

    // Mapping from tokenId to lifecycle audit log events
    mapping(uint256 => LifecycleEvent[]) private _lifecycleHistory;

    // Authorized commerce & escrow contracts
    mapping(address => bool) public authorizedControllers;

    // Events
    event PassportMinted(
        uint256 indexed tokenId,
        uint256 indexed productId,
        address indexed originalMerchant,
        address buyer,
        string productName,
        uint256 priceUsdCents,
        bytes32 paymentTxRef
    );

    event LifecycleStateChanged(
        uint256 indexed tokenId,
        LifecycleState previousState,
        LifecycleState newState,
        address indexed actor,
        string note
    );

    event PassportTransferred(
        uint256 indexed tokenId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 transferCount
    );

    event WarrantyEventLogged(
        uint256 indexed tokenId,
        address indexed claimant,
        string note,
        uint256 timestamp
    );

    modifier onlyAuthorizedController() {
        require(
            authorizedControllers[msg.sender] || msg.sender == owner(),
            "HualPassport: Caller is not authorized controller"
        );
        _;
    }

    constructor() ERC721("Hual Product Passport", "HUAL") Ownable(msg.sender) {
        authorizedControllers[msg.sender] = true;
    }

    function setAuthorizedController(address controller, bool authorized) external onlyOwner {
        authorizedControllers[controller] = authorized;
    }

    /**
     * @notice Mint a new Product Passport upon order creation and escrow deposit.
     */
    function mintPassport(
        address to,
        uint256 productId,
        string memory productName,
        string memory productBrand,
        string memory serialNumber,
        address merchant,
        uint256 priceUsdCents,
        uint256 warrantyDurationSeconds,
        bytes32 pickupSecretHash,
        bytes32 paymentTxRef,
        string memory tokenURI
    ) external onlyAuthorizedController returns (uint256) {
        uint256 tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        uint256 nowTs = block.timestamp;
        uint256 warrantyExpiry = nowTs + warrantyDurationSeconds;

        passports[tokenId] = PassportData({
            tokenId: tokenId,
            productId: productId,
            productName: productName,
            productBrand: productBrand,
            serialNumber: serialNumber,
            originalMerchant: merchant,
            originalPriceUsdCents: priceUsdCents,
            purchaseTimestamp: nowTs,
            warrantyDurationSeconds: warrantyDurationSeconds,
            warrantyExpiresAt: warrantyExpiry,
            currentState: LifecycleState.PAID,
            paymentTxRef: paymentTxRef,
            pickupSecretHash: pickupSecretHash,
            transferCount: 0
        });

        allTokenIds.push(tokenId);

        _lifecycleHistory[tokenId].push(LifecycleEvent({
            state: LifecycleState.PAID,
            actor: to,
            timestamp: nowTs,
            note: "Purchased & Escrowed on Monad",
            txHash: paymentTxRef
        }));

        emit PassportMinted(
            tokenId,
            productId,
            merchant,
            to,
            productName,
            priceUsdCents,
            paymentTxRef
        );

        return tokenId;
    }

    /**
     * @notice Transition the lifecycle state of a passport.
     */
    function updateState(
        uint256 tokenId,
        LifecycleState newState,
        address actor,
        string calldata note
    ) external onlyAuthorizedController {
        PassportData storage passport = passports[tokenId];
        LifecycleState oldState = passport.currentState;
        passport.currentState = newState;

        bytes32 ref = keccak256(abi.encodePacked(tokenId, uint8(newState), block.timestamp, actor));
        _lifecycleHistory[tokenId].push(LifecycleEvent({
            state: newState,
            actor: actor,
            timestamp: block.timestamp,
            note: note,
            txHash: ref
        }));

        emit LifecycleStateChanged(tokenId, oldState, newState, actor, note);
    }

    /**
     * @notice Transfer passport to secondary owner (P2P gift, resale).
     * Maintains the complete provenance chain on Monad.
     */
    function transferPassport(uint256 tokenId, address to) external {
        address currentOwner = ownerOf(tokenId);
        require(
            msg.sender == currentOwner || authorizedControllers[msg.sender],
            "HualPassport: Caller is not owner or authorized controller"
        );
        require(to != address(0), "HualPassport: Invalid recipient");

        _transfer(currentOwner, to, tokenId);

        PassportData storage passport = passports[tokenId];
        passport.transferCount += 1;
        passport.currentState = LifecycleState.TRANSFERRED;

        bytes32 ref = keccak256(abi.encodePacked("TRANSFER", tokenId, to, block.timestamp));
        _lifecycleHistory[tokenId].push(LifecycleEvent({
            state: LifecycleState.TRANSFERRED,
            actor: msg.sender,
            timestamp: block.timestamp,
            note: "Ownership transferred to secondary holder",
            txHash: ref
        }));

        emit PassportTransferred(tokenId, currentOwner, to, passport.transferCount);
    }

    /**
     * @notice Record a warranty claim or repair event without altering original purchase validity.
     */
    function recordWarrantyEvent(uint256 tokenId, string calldata claimNotes) external {
        address currentOwner = ownerOf(tokenId);
        require(
            msg.sender == currentOwner || authorizedControllers[msg.sender] || msg.sender == passports[tokenId].originalMerchant,
            "HualPassport: Unauthorized warranty claim"
        );
        require(block.timestamp <= passports[tokenId].warrantyExpiresAt, "HualPassport: Warranty has expired");

        passports[tokenId].currentState = LifecycleState.UNDER_SERVICE;
        bytes32 ref = keccak256(abi.encodePacked("WARRANTY", tokenId, block.timestamp));

        _lifecycleHistory[tokenId].push(LifecycleEvent({
            state: LifecycleState.UNDER_SERVICE,
            actor: msg.sender,
            timestamp: block.timestamp,
            note: claimNotes,
            txHash: ref
        }));

        emit WarrantyEventLogged(tokenId, msg.sender, claimNotes, block.timestamp);
    }

    /**
     * @notice Verify pickup secret PIN against stored hash.
     */
    function verifyPickupSecret(uint256 tokenId, string calldata plainPIN) external view returns (bool) {
        bytes32 storedHash = passports[tokenId].pickupSecretHash;
        if (storedHash == bytes32(0)) return true;
        return keccak256(abi.encodePacked(plainPIN)) == storedHash;
    }

    /**
     * @notice Retrieve all passports currently owned by an address.
     */
    function getPassportsByOwner(address ownerAddr) external view returns (PassportData[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allTokenIds.length; i++) {
            uint256 tid = allTokenIds[i];
            if (_ownerOf(tid) == ownerAddr) {
                count++;
            }
        }

        PassportData[] memory result = new PassportData[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allTokenIds.length; i++) {
            uint256 tid = allTokenIds[i];
            if (_ownerOf(tid) == ownerAddr) {
                result[idx] = passports[tid];
                idx++;
            }
        }
        return result;
    }

    /**
     * @notice Retrieve all passports in existence.
     */
    function getAllPassports() external view returns (PassportData[] memory) {
        PassportData[] memory result = new PassportData[](allTokenIds.length);
        for (uint256 i = 0; i < allTokenIds.length; i++) {
            result[i] = passports[allTokenIds[i]];
        }
        return result;
    }

    /**
     * @notice Retrieve the complete lifecycle history audit trail for a product passport.
     */
    function getLifecycleHistory(uint256 tokenId) external view returns (LifecycleEvent[] memory) {
        return _lifecycleHistory[tokenId];
    }

    function totalPassports() external view returns (uint256) {
        return allTokenIds.length;
    }
}
