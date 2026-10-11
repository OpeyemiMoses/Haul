const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function main() {
  const [paymaster] = await hre.ethers.getSigners();
  console.log("Paymaster account:", paymaster.address);

  const configPath = path.join(__dirname, "../../frontend/src/contracts/HualProtocolConfig.json");
  const protocolConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

  const usdc = await hre.ethers.getContractAt("TestUSDC", protocolConfig.contracts.USDC.address, paymaster);
  const commerce = await hre.ethers.getContractAt("HualCommerce", protocolConfig.contracts.Commerce.address, paymaster);
  const passport = await hre.ethers.getContractAt("HualPassport", protocolConfig.contracts.Passport.address, paymaster);

  const buyerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  console.log("Buyer embedded address:", buyerAddress);

  const productId = 1;
  const prod = await commerce.products(productId);
  console.log(`Product: ${prod.name} | Price: $${Number(prod.priceUsdCents)/100}`);

  const amountUsdc = BigInt(prod.priceUsdCents) * 10_000n;

  // 1. Ensure Paymaster has USDC to sponsor deposit
  let paymasterBal = await usdc.balanceOf(paymaster.address);
  if (paymasterBal < amountUsdc) {
    console.log("Minting USDC to paymaster for sponsorship...");
    const mintTx = await usdc.mint(paymaster.address, 10000n * 10n ** 6n);
    await mintTx.wait();
  }

  // 2. Paymaster approves Commerce contract for sponsored escrow deposits
  const approveTx = await usdc.approve(protocolConfig.contracts.Commerce.address, amountUsdc * 100n);
  await approveTx.wait();
  console.log("✓ Paymaster USDC allowance approved for commerce escrow");

  // 3. Paymaster executes createOrder on Monad Testnet for the buyer
  console.log("Broadcasting createOrder transaction on Monad Testnet...");
  const orderTx = await commerce.createOrder(
    productId,
    buyerAddress,
    true, // pickup
    hre.ethers.keccak256(hre.ethers.toUtf8Bytes("4921")),
    `SN-MONAD-${Date.now().toString().slice(-6)}`,
    `ipfs://bafybeihualpassport-${productId}-${Date.now()}`
  );
  console.log("Waiting for Monad block confirmation...");
  const receipt = await orderTx.wait();

  console.log("\n=======================================================");
  console.log("   ✓ REAL ONCHAIN PURCHASE COMPLETED ON MONAD TESTNET! ");
  console.log("=======================================================");
  console.log("Tx Hash      :", receipt.hash);
  console.log("Block Number :", receipt.blockNumber);
  console.log("Gas Used     :", receipt.gasUsed.toString());
  console.log("Contract     :", protocolConfig.contracts.Commerce.address);
  console.log("Explorer     :", `https://testnet.monadexplorer.com/tx/${receipt.hash}`);
  console.log("=======================================================\n");
}

main().catch(console.error);
