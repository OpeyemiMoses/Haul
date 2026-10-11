const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const RPC_URL = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

async function main() {
  console.log("\n=======================================================");
  console.log("       HUAL PROTOCOL - PAYMASTER & DEPLOYER SETUP      ");
  console.log("=======================================================\n");

  const envPath = path.join(__dirname, "../.env");
  let privateKey = process.env.PRIVATE_KEY;

  if (!privateKey || privateKey === "your_private_key_here") {
    // Generate a fresh random wallet for the user
    const randomWallet = ethers.Wallet.createRandom();
    privateKey = randomWallet.privateKey;
    
    const envContent = `# Monad Testnet Configuration
MONAD_RPC_URL=${RPC_URL}
CHAIN_ID=10143

# Private Key of Deployer & Sponsored Gas Paymaster
PRIVATE_KEY=${privateKey}
`;
    fs.writeFileSync(envPath, envContent);
    console.log("⚡ Generated a NEW Dedicated Paymaster Wallet & saved to contracts/.env\n");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("📌 Paymaster Public Address :", wallet.address);
  console.log("🔑 Paymaster Private Key    :", `${privateKey.slice(0, 8)}...${privateKey.slice(-6)} (Saved in .env)`);
  console.log("🌐 Network RPC              :", RPC_URL);
  console.log("🔗 Chain ID                 : 10143 (Monad Testnet)\n");

  try {
    const balanceWei = await provider.getBalance(wallet.address);
    const balanceMonad = ethers.formatEther(balanceWei);
    console.log(`💰 Current MONAD Balance    : ${balanceMonad} MONAD`);

    if (balanceWei === 0n) {
      console.log("\n⚠️  Paymaster balance is 0 MONAD.");
      console.log("👉 Claim free testnet MONAD from the official faucet:");
      console.log("   https://testnet.monad.xyz");
      console.log(`   (Paste Address: ${wallet.address})\n`);
    } else {
      console.log("✅ Paymaster is funded and ready to deploy & sponsor transactions!\n");
    }
  } catch (err) {
    console.log("⚠️ Could not fetch balance from RPC:", err.message);
    console.log("👉 Fund this address with testnet MONAD: " + wallet.address);
  }
}

main().catch(console.error);
