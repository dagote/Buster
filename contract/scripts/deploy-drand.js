const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("\n🚀 Deploying DrandGame to Polygon mainnet...");
  console.log("Deployer:", deployer.address);

  const DrandGame = await ethers.getContractFactory("DrandGame");
  const drandGame = await DrandGame.deploy();
  await drandGame.deployed();

  console.log("✅ DrandGame deployed to:", drandGame.address);
  console.log("\nSave this address to .env:");
  console.log("DRANDGAME_ADDRESS=" + drandGame.address);
  console.log("\nOr update contract/.env manually");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
