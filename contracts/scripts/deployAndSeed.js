const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, merchantA, merchantB] = await hre.ethers.getSigners();
  console.log("Deploying HualPassport with account:", deployer.address);

  const HualPassport = await hre.ethers.getContractFactory("HualPassport");
  const passport = await HualPassport.deploy();
  await passport.waitForDeployment();

  const contractAddress = await passport.getAddress();
  console.log("HualPassport deployed to:", contractAddress);

  // Authorize deployer as operator for relaying gasless transactions
  await passport.setAuthorizedOperator(deployer.address, true);

  console.log("\n--- Listing Real Products Onchain ---");

  // 1. Sony Headphones
  const tx1 = await passport.connect(deployer).listProduct(
    "Sony WH-1000XM5 Wireless Headphones",
    "Sony Electronics",
    "Audio",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    "Industry-leading noise canceling with two processors and 8 microphones. Stored as living onchain Product Passport on Monad.",
    25000, // $250.00
    365 * 24 * 60 * 60, // 12 months
    15 // stock
  );
  await tx1.wait();
  console.log("✓ Listed Product 1: Sony WH-1000XM5 onchain");

  // 2. Fujifilm X100VI
  const tx2 = await passport.connect(deployer).listProduct(
    "Fujifilm X100VI Limited Edition Camera",
    "Fujifilm",
    "Optics",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
    "40.2MP X-Trans CMOS 5 HR sensor with in-body stabilization. Cryptographic serial passport for authentic secondary transfer.",
    45000, // $450.00
    2 * 365 * 24 * 60 * 60, // 24 months
    8 // stock
  );
  await tx2.wait();
  console.log("✓ Listed Product 2: Fujifilm X100VI onchain");

  // 3. Seiko Prospex Diver
  const tx3 = await passport.connect(deployer).listProduct(
    "Seiko Prospex Diver 'Great Wave'",
    "Seiko Horology",
    "Watches",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    "Automatic mechanical caliber with 200m water resistance and sapphire crystal. Backed by Monad smart contract warranty.",
    35000, // $350.00
    3 * 365 * 24 * 60 * 60, // 36 months
    10 // stock
  );
  await tx3.wait();
  console.log("✓ Listed Product 3: Seiko Prospex onchain");

  // 4. Aether 01 Cyber-Knit Sneakers
  const tx4 = await passport.connect(deployer).listProduct(
    "Aether 01 Cyber-Knit Sneakers",
    "Aether Studio",
    "Footwear",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    "Recycled carbon weave upper with reactive kinetic soles. Linkable to Hual digital twin passport.",
    19500, // $195.00
    180 * 24 * 60 * 60, // 6 months
    20 // stock
  );
  await tx4.wait();
  console.log("✓ Listed Product 4: Aether 01 Sneakers onchain");

  // Export contract details to frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/HualPassport.sol/HualPassport.json");
  let artifact = {};
  if (fs.existsSync(artifactPath)) {
    artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  }

  const exportData = {
    address: contractAddress,
    chainId: hre.network.config.chainId || 31337,
    abi: artifact.abi || [],
  };

  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(frontendContractsDir, "HualPassportConfig.json"),
    JSON.stringify(exportData, null, 2)
  );

  console.log("✓ Exported contract address and ABI to frontend/src/contracts/HualPassportConfig.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
