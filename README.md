# HUAL

> **The Onchain Commerce Layer for Products You Can Buy, Own, Verify, and Transfer.**
> *"Receipts are dead after checkout. Products are alive."*

Built for the **Monad Metropolis Hackathon**.

---

## 1. What is Hual?

Hual is a consumer commerce protocol where every eligible purchase receives a living, verifiable **Product Passport** on Monad.

Traditional commerce treats the checkout receipt as the end of the transaction. But in real life, a product's journey is just starting:
```text
DISCOVER → BUY → PAY → READY → COLLECT → ACTIVE OWNERSHIP → SERVICE/WARRANTY → TRANSFER → RESELL
```

Hual turns disconnected, easily forged paper and screenshot receipts into a living onchain state machine.

### Zero Mocked Data
Every piece of data in Hual is verified onchain:
- **Products & Inventory:** Stored directly in the `HualPassport` smart contract storage mapping.
- **Settlement:** Real EVM transactions with cryptographic transaction hashes.
- **Physical Pickup:** Merchant counter verifies customer secret PINs via onchain `keccak256` matching before recording handovers.
- **Ownership & Provenance:** Full onchain audit trail tracking original merchants, previous owners, warranty claims, and secondary transfers.

---

## 2. Why Monad?

1. **Sub-Second Finality:** In-person retail checkout and physical handoff verification cannot tolerate 15-second block confirmations. Monad's sub-second finality makes in-store QR verification instant.
2. **Micro-Cent Gas Sponsorship:** Hual sponsors 100% of consumer gas fees via Paymaster/Relayer. Sponsoring 5+ lifecycle transitions per product (Order → Paid → Packaged → Collected → Warranty Claim → Secondary Transfer) costs fractions of a cent on Monad, making gasless consumer adoption commercially viable.
3. **High Throughput (10,000 TPS):** Accommodates high-frequency consumer retail traffic without congestion spikes.

---

## 3. Smart Contract Architecture

The core contract is `HualPassport.sol` (EVM Cancun target, Solidity `0.8.24`):

- **Standard:** ERC-721 with dynamic lifecycle state machine.
- **Key Functions:**
  - `listProduct(...)`: Merchants add inventory directly to the contract.
  - `getAllActiveProducts()`: Queries live onchain inventory.
  - `buyAndMintPassport(...)`: Settles purchase, decrements stock, and mints the living passport.
  - `markReady(tokenId)`: Merchant stages item for pickup.
  - `confirmCollection(tokenId, secretPIN)`: Cryptographically verifies pickup PIN and updates state to `Collected`.
  - `transferPassport(tokenId, toAddress)`: Transfers digital ownership and updates provenance lineage.
  - `recordWarrantyClaim(tokenId, notes)`: Logs service/repair events without invalidating original provenance.
  - `getLifecycleHistory(tokenId)`: Retrieves the immutable onchain audit trail.

---

## 4. Quick Start

### 1. Smart Contracts & Local Node
```bash
cd contracts
npm install
npx hardhat test # Runs the 100% green test suite
npx hardhat node # Starts local node
npx hardhat run scripts/deployAndSeed.js --network localhost
```

### 2. Frontend Web App
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to explore:
1. **Shop & Discover:** Gasless 1-click checkout.
2. **My Passports:** Interactive Product Passport with 3D card layout, warranty timer, and QR handoff code.
3. **Merchant Counter:** Verify customer pickup codes and list new products onchain.
4. **Monad Architecture:** Real-time onchain metrics and protocol comparison.
