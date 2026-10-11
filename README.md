# Haul Protocol

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Network: Monad Testnet](https://img.shields.io/badge/Network-Monad%20Testnet%20(10143)-836EF9.svg)](https://testnet.monad.xyz)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24%20(Cancun)-363636.svg)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB.svg)](https://react.dev/)
[![Groq AI](https://img.shields.io/badge/AI%20Engine-Groq%20Llama%203.3%2070B-F55036.svg)](https://groq.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**The Decentralized High-Throughput Commerce Protocol on Monad for Products You Can Buy, Own, Verify, and Transfer.**

*"Paper and screenshot receipts die after checkout. Products are alive."*

[Features](#-key-features) • [Architecture](#-protocol-architecture) • [Contracts](#-deployed-contracts-on-monad-testnet) • [Quick Start](#-quick-start) • [Environment Setup](#-environment-configuration) • [Documentation](#-community--documentation)

</div>

---

## 📖 Overview

**Haul** is an onchain consumer commerce protocol engineered for the **Monad Metropolis Hackathon**. It bridges physical retail, digital escrow, and living ownership by minting a dynamic **ERC-721 Product Passport** for every purchase.

In traditional commerce, checkout receipts are static, disconnected, and easily forged. When a buyer leaves the counter, warranty claims, service histories, and resale authenticity are fragmented across paper receipts and emails.

Haul transforms retail transactions into an immutable onchain state machine:

```text
DISCOVER ➔ BUY (1-Click Gasless) ➔ ESCROW ➔ STAGED ➔ PHYSICAL PICKUP PIN HANDSHAKE ➔ ACTIVE OWNERSHIP ➔ WARRANTY CLAIM ➔ RESALE TRANSFER
```

### Why Monad?
- **Sub-Second Finality:** In-store physical pickups require instant barcode/QR verification without waiting 15–30 seconds for block confirmations.
- **Micro-Cent Gas Sponsorship:** Haul sponsors 100% of customer gas fees through an onchain paymaster and relayer. Executing 5+ lifecycle transitions per item costs fractions of a cent on Monad.
- **10,000 TPS Scalability:** Handles consumer retail traffic without network congestion spikes.

---

## ⚡ Key Features

### 1. Dynamic Living Product Passports (ERC-721)
- Every product carries an onchain passport tracking serial number, original merchant, purchase timestamp, warranty duration, and state progression (`Ordered`, `ReadyForPickup`, `Collected`, `WarrantyActive`, `Transferred`).
- Zero mocked data: Every inventory item, stock level, and passport lineage is queried directly from Monad RPC.

### 2. Gasless Consumer Checkout (Sponsored Paymaster)
- Powered by Privy Embedded Wallets and an onchain relayer.
- Consumers experience zero gas popups and 0 MON fee friction—the protocol sponsors transaction gas behind the scenes.

### 3. Cryptographic In-Store Pickup Handshake
- At purchase, a deterministic 4-digit secret PIN is hashed onchain via `keccak256`.
- The merchant enters or scans the customer PIN at the point of sale. Only matching hashes release escrowed funds and transition the passport to `Collected`.

### 4. Decentralized Store Manager & Merchant Dashboard
- Merchants can register their own onchain store profile, customize location, operating hours, office schedules, banner styling, and contact metadata.
- Integrated Point of Sale (POS) counter for fulfilling orders, staging inventory, and confirming pickups.

### 5. Peer-to-Peer & Merchant Messaging Hub
- Direct messaging between buyers and store owners.
- Real-time conversation threads, unread badges, order context attachments, and responsive mobile-first messaging views.

### 6. AI Account Companion & Store Manager (Groq Llama 3.3 70B)
- Embedded floating AI assistant powered by Groq's high-speed inference engine.
- **Account Reasoning:** Knows all pending, received, escrowed, and transferred orders associated with your wallet.
- **Interactive Disambiguation:** When asking for pickup PINs or tracking codes without specifying an order, the AI presents clickable order cards to select the exact item.
- **Store Support:** Answers shipping, escrow, and warranty questions, while directing store-specific product inquiries to the respective merchant.

---

## 🏛️ Protocol Architecture

```mermaid
graph TD
    User([Consumer / Merchant]) -->|Social / Wallet Login| Privy[Privy Embedded Auth]
    User -->|Gasless Action| Relayer[Sponsored Gas Paymaster / Relayer]
    
    Relayer -->|USDC Approval & Transfer| USDC[TestUSDC Token (ERC-20)]
    Relayer -->|Order Creation & State Updates| Commerce[HualCommerce Contract]
    
    Commerce -->|Escrow Deposits & Payouts| Escrow[HualEscrow Contract]
    Commerce -->|Mint & Lifecycle State Machine| Passport[HualPassport (ERC-721)]
    
    User -->|Store & Order Questions| Groq[Groq AI Assistant - Llama 3.3 70B]
    Groq -.->|Reads Monad RPC State| Passport
    
    User -->|Direct Merchant Inquiries| Messaging[P2P Messaging Registry]
```

---

## 📜 Deployed Contracts on Monad Testnet

**Monad Testnet Details:**
- **Network Name:** Monad Testnet
- **Chain ID:** `10143`
- **RPC URL:** `https://testnet-rpc.monad.xyz`
- **Block Explorer:** [https://testnet.monadexplorer.com](https://testnet.monadexplorer.com)

| Contract | Address | Description |
| :--- | :--- | :--- |
| **HualPassport** | [`0x6daBB7eF8863D3D8528CBcC5365d69D93e359658`](https://testnet.monadexplorer.com/address/0x6daBB7eF8863D3D8528CBcC5365d69D93e359658) | Dynamic ERC-721 living product passport & lifecycle registry |
| **HualEscrow** | [`0x876Ccc1F4efdfFa786bB5cf1E36d77cE07690dcf`](https://testnet.monadexplorer.com/address/0x876Ccc1F4efdfFa786bB5cf1E36d77cE07690dcf) | Non-custodial escrow holding funds until cryptographic PIN verification |
| **HualCommerce** | [`0x8576126968f31dfbC4088560ae2B58028571adaA`](https://testnet.monadexplorer.com/address/0x8576126968f31dfbC4088560ae2B58028571adaA) | Main protocol router coordinating inventory, payments, and minting |
| **TestUSDC** | [`0x1Ba9b061043a40340213861C0BD95148e19Fe338`](https://testnet.monadexplorer.com/address/0x1Ba9b061043a40340213861C0BD95148e19Fe338) | Protocol settlement token with public minting capabilities |

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Blockchain** | Monad Testnet, EVM Cancun, Solidity `^0.8.24` |
| **Smart Contract Tooling** | Hardhat, Ethers.js v6 |
| **Frontend Framework** | React 19, Vite, Vanilla CSS Design System |
| **Authentication & Wallets** | Privy Embedded Wallets, Viem, Wagmi |
| **AI Support Model** | Groq SDK (`llama-3.3-70b-versatile`) |
| **Icons & Media** | Lucide React, Apple Glassmorphic CSS Engine |

---

## 📁 Repository Structure

```text
Haul/
├── contracts/                  # Solidity smart contracts & Hardhat suite
│   ├── contracts/
│   │   ├── HualPassport.sol    # Dynamic ERC-721 living product passport
│   │   ├── HualEscrow.sol      # Cryptographic escrow lock
│   │   ├── HualCommerce.sol    # Protocol coordinator & catalog
│   │   └── TestUSDC.sol        # Test settlement token
│   ├── scripts/
│   │   ├── deployProtocol.js   # Automated deployment & seeding script
│   │   └── testDiag.js         # Monad testnet diagnostic suite
│   ├── test/                   # Hardhat test suite (100% passing)
│   └── hardhat.config.js
│
├── frontend/                   # Modern React 19 dApp
│   ├── src/
│   │   ├── components/         # Glassmorphic UI components
│   │   │   ├── AISupportFAB.jsx      # Minimal circular AI floating action button
│   │   │   ├── AISupportModal.jsx    # Fresh-session AI assistant with order picker
│   │   │   ├── Marketplace.jsx       # Catalog, product detail, and merchant tabs
│   │   │   ├── MerchantDashboard.jsx # Merchant metrics, fulfillment & PIN verification
│   │   │   ├── EditStoreModal.jsx    # Store management (location, hours, branding)
│   │   │   ├── InboxPage.jsx         # Cross-user and store messaging hub
│   │   │   └── PassportCard.jsx      # Living Product Passport 3D viewer
│   │   ├── contracts/          # Contract ABIs & deployed network configurations
│   │   ├── lib/
│   │   │   ├── groqClient.js         # Groq AI client with order reasoning engine
│   │   │   ├── messageRegistry.js    # P2P and merchant message store
│   │   │   └── web3.js               # Ethers / Monad testnet interaction layer
│   │   └── index.css                 # Apple-glass luxury design tokens
│   └── package.json
│
├── .github/                    # Community standards & GitHub workflows
│   ├── ISSUE_TEMPLATE/         # Bug report & feature request templates
│   └── PULL_REQUEST_TEMPLATE.md
├── CODE_OF_CONDUCT.md          # Contributor Covenant v2.1
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # MIT License
├── README.md                   # Project documentation
└── SECURITY.md                 # Security disclosure policy
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- A free API key from [Groq Console](https://console.groq.com) (for AI support)

### 2. Clone the Repository
```bash
git clone https://github.com/OpeyemiMoses/Haul.git
cd Haul
```

### 3. Setup Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Smart Contracts (Optional Local Testing)
```bash
cd ../contracts
cp .env.example .env
npm install

# Run the contract test suite
npx hardhat test

# Deploy to Monad Testnet (requires testnet MONAD in PRIVATE_KEY)
npx hardhat run scripts/deployProtocol.js --network monadTestnet
```

---

## ⚙️ Environment Configuration

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:

```env
# Privy Application ID (from https://dashboard.privy.io)
VITE_PRIVY_APP_ID=your_privy_app_id

# Monad Network RPC
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
VITE_MONAD_CHAIN_ID=10143

# Sponsored Gas Paymaster / Relayer
VITE_SPONSORED_PAYMASTER_KEY=0x...
VITE_SPONSORED_PAYMASTER_ADDR=0x...

# Groq AI API Key (from https://console.groq.com)
VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Contracts (`contracts/.env`)
```env
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=10143
PRIVATE_KEY=your_deployer_private_key
```

---

## 🤝 Community & Documentation

We are committed to fostering an inclusive, welcoming open-source community:

- **[Code of Conduct](CODE_OF_CONDUCT.md)**: Details our standards of acceptable behavior and enforcement guidelines.
- **[Contributing Guidelines](CONTRIBUTING.md)**: Instructions for submitting bug reports, features, and pull requests.
- **[Security Policy](SECURITY.md)**: Procedures for responsibly disclosing smart contract or protocol vulnerabilities.
- **[License](LICENSE)**: MIT License.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with precision for high-speed commerce on Monad.
