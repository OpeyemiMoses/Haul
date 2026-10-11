const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Setting authorizations for Paymaster:", deployer.address);

  const configPath = path.join(__dirname, "../../frontend/src/contracts/HualProtocolConfig.json");
  const protocolConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

  const passportAddress = protocolConfig.contracts.Passport.address;
  const HualPassport = await hre.ethers.getContractAt("HualPassport", passportAddress, deployer);

  const isAuth = await HualPassport.authorizedControllers(deployer.address);
  if (!isAuth) {
    console.log("Authorizing Paymaster on HualPassport...");
    const tx = await HualPassport.setAuthorizedController(deployer.address, true);
    await tx.wait();
    console.log("✓ Paymaster successfully authorized on HualPassport!");
  } else {
    console.log("✓ Paymaster already authorized on HualPassport.");
  }
}

main().catch(console.error);
