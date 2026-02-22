const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying BusterGame to Polygon...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer account:", deployer.address);
  console.log("");

  // Load your-instance.json for configuration
  const deploymentConfigPath = path.join(
    __dirname,
    "../deployments/your-instance.json"
  );
  let deploymentConfig = {};

  try {
    const configContent = fs.readFileSync(deploymentConfigPath, "utf8");
    deploymentConfig = JSON.parse(configContent);
  } catch (error) {
    console.warn("Warning: Could not read your-instance.json");
  }

  // Configuration - from .env or your-instance.json
  const feeReceiverAddress =
    process.env.FEE_RECEIVER_ADDRESS || deploymentConfig.feeReceiver;
  const serverWalletAddress =
    process.env.SERVER_WALLET_ADDRESS || deploymentConfig.serverWallet;

  console.log("Configuration:");
  console.log("  Fee Receiver:  ", feeReceiverAddress);
  console.log("  Server Wallet: ", serverWalletAddress);
  console.log("  FEE_PERCENT:   2% (immutable)");
  console.log("");

  // Validate
  if (!feeReceiverAddress || feeReceiverAddress.includes("YOUR_")) {
    throw new Error(
      "Fee receiver address not configured. Update deployments/your-instance.json"
    );
  }
  if (!serverWalletAddress || serverWalletAddress.includes("YOUR_")) {
    throw new Error(
      "Server wallet address not configured. Update deployments/your-instance.json"
    );
  }
  if (feeReceiverAddress === serverWalletAddress) {
    throw new Error("Fee receiver and server wallet must be different addresses");
  }

  // Deploy
  console.log("Deploying contract...");
  const BusterGame = await ethers.getContractFactory("BusterGame");
  const buster = await BusterGame.deploy(
    feeReceiverAddress,
    serverWalletAddress
  );

  await buster.waitForDeployment();
  const contractAddress = await buster.getAddress();

  console.log("✅ Deployment successful!");
  console.log("");
  console.log("Contract Details:");
  console.log("  Address:         ", contractAddress);
  console.log("  Network:         ", (await ethers.provider.getNetwork()).name);
  console.log("  Chain ID:        ", (await ethers.provider.getNetwork()).chainId);
  console.log("  Fee Receiver:    ", await bitcino.feeReceiver());
  console.log("  Server Wallet:   ", await bitcino.serverWallet());
  console.log("  FEE_PERCENT:     ", (await bitcino.FEE_PERCENT()).toString() + "%");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    name: "Bitcino Protocol - Your Instance",
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    contractAddress: contractAddress,
    feeReceiver: feeReceiverAddress,
    serverWallet: serverWalletAddress,
    feePercent: 2,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    verified: false,
  };

  console.log("Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");

  // Save to file
  const deploymentFile = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("📁 Deployment info saved to: deployment.json");
  console.log("");

  // Also update your-instance.json
  deploymentConfig.contractAddress = contractAddress;
  deploymentConfig.deployedAt = deploymentInfo.deployedAt;
  deploymentConfig.verified = false;

  fs.writeFileSync(deploymentConfigPath, JSON.stringify(deploymentConfig, null, 2));
  console.log("📝 Updated deployments/your-instance.json with contract address");
  console.log("");

  console.log("🎉 Ready to use!");
  console.log("");
  console.log("Next steps:");
  console.log('  1. Copy CONTRACT_ADDRESS: "' + contractAddress + '"');
  console.log(
    '  2. Add to ../server/.env as CONTRACT_ADDRESS=' + contractAddress
  );
  console.log(
    '  3. Add to ../frontend/.env.local as REACT_APP_CONTRACT_ADDRESS=' +
      contractAddress
  );
  console.log("");
  console.log("Then run:");
  console.log("  cd ../server && python main.py");
  console.log("  cd ../frontend && npm start");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
