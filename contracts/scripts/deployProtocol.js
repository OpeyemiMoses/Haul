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

  // 1. Deploy TestUSDC
  const TestUSDC = await hre.ethers.getContractFactory("TestUSDC");
  const usdc = await TestUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✓ TestUSDC deployed to:", usdcAddress);

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

  // 6. List initial merchant products onchain
  console.log("\n--- Listing Real Products in Onchain Catalog ---");

  // Product 1: Sony WH-1000XM5
  await commerce.connect(deployer).listProduct(
    "Sony WH-1000XM5 Wireless Headphones",
    "Sony Electronics",
    "Audio",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    "Industry-leading noise canceling with dual processors and 8 microphones. Stored as living onchain Product Passport on Monad.",
    25000, // $250.00
    365 * 24 * 3600, // 12 months
    12, // stock
    true, // in-store pickup
    true // delivery
  );
  console.log("✓ Product 1 listed: Sony WH-1000XM5 ($250.00 USDC)");

  // Product 2: Fujifilm X100VI
  await commerce.connect(deployer).listProduct(
    "Fujifilm X100VI Limited Edition Camera",
    "Fujifilm",
    "Optics",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
    "40.2MP X-Trans CMOS 5 HR sensor with in-body stabilization. Cryptographic serial passport for authentic secondary transfer.",
    45000, // $450.00
    2 * 365 * 24 * 3600, // 24 months
    6, // stock
    true,
    true
  );
  console.log("✓ Product 2 listed: Fujifilm X100VI ($450.00 USDC)");

  // Product 3: Seiko Prospex Diver
  await commerce.connect(deployer).listProduct(
    "Seiko Prospex Diver 'Great Wave'",
    "Seiko Horology",
    "Watches",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    "Automatic mechanical caliber with 200m water resistance and sapphire crystal. Backed by Monad smart contract warranty.",
    35000, // $350.00
    3 * 365 * 24 * 3600, // 36 months
    8, // stock
    true,
    false // pickup only
  );
  console.log("✓ Product 3 listed: Seiko Prospex Diver ($350.00 USDC)");

  // Product 4: Aether 01 Cyber-Knit Sneakers
  await commerce.connect(deployer).listProduct(
    "Aether 01 Cyber-Knit Sneakers",
    "Aether Studio",
    "Footwear",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    "Recycled carbon weave upper with reactive kinetic soles. Linkable to Hual digital twin passport.",
    19500, // $195.00
    180 * 24 * 3600, // 6 months
    15, // stock
    false,
    true // delivery only
  );
  console.log("✓ Product 4 listed: Aether 01 Sneakers ($195.00 USDC)");

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
