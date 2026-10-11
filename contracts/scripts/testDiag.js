const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function main() {
  const [paymaster] = await hre.ethers.getSigners();
  const configPath = path.join(__dirname, "../../frontend/src/contracts/HualProtocolConfig.json");
  const protocolConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

  const usdc = await hre.ethers.getContractAt("TestUSDC", protocolConfig.contracts.USDC.address, paymaster);
  const commerce = await hre.ethers.getContractAt("HualCommerce", protocolConfig.contracts.Commerce.address, paymaster);
  const passport = await hre.ethers.getContractAt("HualPassport", protocolConfig.contracts.Passport.address, paymaster);
  const escrow = await hre.ethers.getContractAt("HualEscrow", protocolConfig.contracts.Escrow.address, paymaster);

  console.log("Paymaster Address :", paymaster.address);
  console.log("Commerce Address  :", await commerce.getAddress());
  console.log("Passport Address  :", await passport.getAddress());
  console.log("Escrow Address    :", await escrow.getAddress());

  console.log("\n--- Checking Authorizations ---");
  const isRelayer = await commerce.authorizedRelayers(paymaster.address);
  console.log("Paymaster is authorized relayer on Commerce :", isRelayer);

  const isPassportCtrl = await passport.authorizedControllers(await commerce.getAddress());
  console.log("Commerce is authorized controller on Passport:", isPassportCtrl);

  const escrowCommerce = await escrow.commerceContract();
  console.log("Escrow's configured Commerce contract       :", escrowCommerce);

  const prod = await commerce.products(1);
  console.log("Product 1 Name :", prod.name);
  console.log("Product 1 Stock:", prod.stock.toString());
  console.log("Product 1 Active:", prod.active);
  console.log("Product 1 Price:", prod.priceUsdCents.toString(), "cents");

  const paymasterBal = await usdc.balanceOf(paymaster.address);
  console.log("Paymaster USDC balance:", paymasterBal.toString());

  const allowance = await usdc.allowance(paymaster.address, await commerce.getAddress());
  console.log("Paymaster USDC allowance to Commerce:", allowance.toString());

  // Test staticCall to get the exact revert reason if any
  try {
    console.log("\nTesting staticCall createOrder...");
    const res = await commerce.createOrder.staticCall(
      1,
      paymaster.address,
      true,
      hre.ethers.ZeroHash,
      "SN-TEST-123",
      "ipfs://test"
    );
    console.log("✓ staticCall succeeded! orderId:", res[0].toString(), "tokenId:", res[1].toString());

    console.log("Sending actual onchain transaction...");
    const tx = await commerce.createOrder(
      1,
      paymaster.address,
      true,
      hre.ethers.ZeroHash,
      "SN-TEST-123",
      "ipfs://test"
    );
    const rc = await tx.wait();
    console.log("✓✓ TX CONFIRMED ON MONAD TESTNET! Hash:", rc.hash);
  } catch (err) {
    console.error("staticCall / TX failed:", err);
  }
}

main().catch(console.error);
