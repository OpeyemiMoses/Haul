const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  
  if (!deployer) {
    throw new Error("No deployer account found. Make sure PRIVATE_KEY is set in contracts/.env");
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("=======================================================");
  console.log("             HUAL PROTOCOL CONTRACT DEPLOYMENT         ");
  console.log("=======================================================");
  console.log("🌐 Network          :", hre.network.name);
  console.log("📌 Deployer/Sponsor :", deployer.address);
  console.log("💰 Balance          :", hre.ethers.formatEther(balance), "MONAD");
  console.log("=======================================================\n");

  if (balance === 0n && hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.error("❌ ERROR: Deployer account has 0 MONAD.");
    console.error("👉 Please claim free testnet MONAD from https://testnet.monad.xyz");
    console.error(`   Address: ${deployer.address}\n`);
    process.exit(1);
  }

  // 1. Resolve Official USDC on Monad Mainnet
  let usdcAddress = process.env.OFFICIAL_USDC_ADDRESS || "0x754704Bc059F8C67012fEd69BC8A327a5aafb603";
  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    const TestUSDC = await hre.ethers.getContractFactory("TestUSDC");
    const usdc = await TestUSDC.deploy();
    await usdc.waitForDeployment();
    usdcAddress = await usdc.getAddress();
    console.log("✓ (Local Dev) Mock USDC deployed to:", usdcAddress);
  } else {
    console.log("✓ Using Official Monad USDC at:", usdcAddress);
  }

  // 2. Deploy HualPassport
  const HualPassport = await hre.ethers.getContractFactory("HualPassport");
  const passport = await HualPassport.deploy();
  await passport.waitForDeployment();
  const passportAddress = await passport.getAddress();
  console.log("✓ HualPassport deployed to:", passportAddress);

  // 3. Deploy HualEscrow
  const HualEscrow = await hre.ethers.getContractFactory("HualEscrow");
  const escrow = await HualEscrow.deploy(usdcAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✓ HualEscrow deployed to:", escrowAddress);

  // 4. Deploy HualCommerce
  const HualCommerce = await hre.ethers.getContractFactory("HualCommerce");
  const commerce = await HualCommerce.deploy(usdcAddress, passportAddress, escrowAddress);
  await commerce.waitForDeployment();
  const commerceAddress = await commerce.getAddress();
  console.log("✓ HualCommerce deployed to:", commerceAddress);

  // 5. Connect permissions
  await passport.setAuthorizedController(commerceAddress, true);
  await escrow.setCommerceContract(commerceAddress);
  await commerce.setAuthorizedRelayer(deployer.address, true);
  console.log("✓ Configured protocol authorizations");

  console.log("\n--- Skipping Demo Mock Listings (100% Genuine Privy/Merchant Catalog) ---");

  // 7. Export protocol artifacts to frontend
  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const readAbi = (solFile, contractName) => {
    const file = path.join(artifactsDir, solFile, `${contractName}.json`);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8")).abi;
    }
    return [];
  };

  const protocolConfig = {
    chainId: hre.network.config.chainId || 31337,
    networkName: hre.network.name,
    contracts: {
      USDC: {
        address: usdcAddress,
        abi: readAbi("TestUSDC.sol", "TestUSDC"),
      },
      Passport: {
        address: passportAddress,
        abi: readAbi("HualPassport.sol", "HualPassport"),
      },
      Escrow: {
        address: escrowAddress,
        abi: readAbi("HualEscrow.sol", "HualEscrow"),
      },
      Commerce: {
        address: commerceAddress,
        abi: readAbi("HualCommerce.sol", "HualCommerce"),
      },
    },
  };

  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(frontendContractsDir, "HualProtocolConfig.json"),
    JSON.stringify(protocolConfig, null, 2)
  );

  console.log("\n✓ Protocol configuration exported to frontend/src/contracts/HualProtocolConfig.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
