# Bitcino Deployment Guide

## Prerequisites

- Polygon Mumbai testnet RPC access
- Private key with testnet MATIC
- Node.js 16+
- Python 3.9+

## Deployment Checklist

### 1. Smart Contract to Polygon

```bash
cd contract
npm install
# Edit .env with your private key
npx hardhat run scripts/deploy.js --network mumbai
# Save contract address!
export CONTRACT_ADDRESS=0x...
```

### 2. Server Setup

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Edit .env with CONTRACT_ADDRESS and your RPC
python main.py &
```

### 3. Frontend Setup

```bash
cd frontend
npm install
# Edit .env.local with CONTRACT_ADDRESS and SERVER_URL
npm run build
# Serve build/ folder (e.g., with Vercel, Netlify, or local server)
```

## Environment Variables Summary

### Contract (`contract/.env`)
```
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key
```

### Server (`server/.env`)
```
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=server_private_key
PORT=8000
```

### Frontend (`frontend/.env.local`)
```
REACT_APP_SERVER_URL=http://localhost:8000
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_NETWORK_ID=80001
```

## Testing the Deployment

1. Open frontend on http://localhost:3000
2. Connect MetaMask (Mumbai testnet)
3. Get testnet MATIC from faucet
4. Place a bet and play game
5. Check results on [PolygonScan Mumbai](https://mumbai.polygonscan.com/)

## Moving to Mainnet

1. Change network in Hardhat config to `polygon`
2. Update RPC URL to mainnet
3. Update `.env` files across all layers
4. Redeploy contract
5. Update frontend .env.local

**WARNING**: Test extensively on testnet before mainnet.

## Troubleshooting

**Contract deployment fails**
- Ensure account has enough MATIC
- Check RPC URL is correct
- Verify private key format

**Server won't start**
- Ensure Python 3.9+ installed
- Install all requirements: `pip install -r requirements.txt`
- Check port 8000 is free

**Frontend can't connect**
- Check server endpoint in .env.local
- Ensure MetaMask is on correct network
