// minimal Hardhat configuration without toolbox
require("@nomiclabs/hardhat-ethers");
const fs = require("fs");
const path = require("path");

// Load .env from parent directory
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value && !process.env[key]) {
        process.env[key] = value.trim();
      }
    });
}

const getPrivateKey = () => {
  if (process.env.DEVELOPER_PRIVATE_KEY) return process.env.DEVELOPER_PRIVATE_KEY;
  if (process.env.PRIVATE_KEY) return process.env.PRIVATE_KEY;
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
};

const privateKey = getPrivateKey();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    amoy: {
      url: process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology/",
      accounts: privateKey ? [privateKey] : [],
      chainId: 80002,
      gasPrice: 30000000000, // 30 Gwei
    },
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC_URL || "https://1rpc.io/matic",
      accounts: privateKey ? [privateKey] : [],
      chainId: 137,
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY || "",
  },
};