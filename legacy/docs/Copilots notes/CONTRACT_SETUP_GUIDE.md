# Polygon Mumbai Contract Setup Guide

## Your Current Setup

✅ Using **Polygon Mumbai Testnet** (NOT Solana)  
✅ Using **MetaMask** wallet  
✅ Using **MATIC** tokens for testing  
❌ Contract NOT YET deployed

## Step 1: Get a Test Wallet

### Option A: Use MetaMask (Recommended)
1. Install [MetaMask](https://metamask.io/)
2. Create/import a wallet
3. Go to Settings → Networks → Add Network
4. Add Polygon Mumbai:
   - Network name: `Polygon Mumbai`
   - RPC URL: `https://rpc-mumbai.maticvigil.com`
   - Chain ID: `80001`
   - Currency: `MATIC`

### Option B: Already Have MetaMask?
1. Just switch to Polygon Mumbai network
2. Get testnet MATIC from faucet

## Step 2: Get Testnet MATIC

Get free testnet MATIC here:  
**https://faucet.polygon.technology/**

1. Select "Mumbai" network
2. Paste your wallet address (from MetaMask)
3. Click "Submit"
4. Wait 1-2 minutes

Check your balance in MetaMask (should show ~2 MATIC)

## Step 3: Deploy the Smart Contract

From `c:\projects\bitcino\contract\`:

```bash
# Install dependencies (first time only)
npm install

# Deploy to Mumbai testnet
npm run deploy:mumbai
```

You'll see output like:
```
Contract deployed to: 0x1234567890123456789012345678901234567890
```

## Step 4: Update Configuration Files

### Step 4a: Update `contract/deployments/your-instance.json`

```json
{
  "network": "polygon-mumbai",
  "chainId": 80001,
  "contractAddress": "0x...",          // <- Your deployed address
  "feeReceiver": "0x...",              // <- Your wallet address
  "serverWallet": "0x...",             // <- Same as feeReceiver for testing
  "deployedAt": "2026-02-21",
  "deployer": "0x...",                 // <- Your wallet address
  "verified": false
}
```

### Step 4b: Update `server/.env`

```env
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com

# Your deployed contract
CONTRACT_ADDRESS=0x...                 # <- From deployment

# Path to compiled ABI
CONTRACT_ABI_PATH=../contract/artifacts/contracts/BitcinoBetEscrow.sol/BitcinoBetEscrow.json

# Your test wallet (MetaMask)
SERVER_PRIVATE_KEY=0x...               # <- Your private key (KEEP SECRET!)
SERVER_WALLET_ADDRESS=0x...            # <- Your wallet address
```

### Step 4c: Update `root/.env`

```env
NETWORK=polygon_mumbai
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
CONTRACT_ADDRESS=0x...                 # <- Same as server/.env
CONTRACT_ABI_PATH=./contract/artifacts/contracts/BitcinoBetEscrow.sol/BitcinoBetEscrow.json
```

## Step 5: Verify Contract Deployment

Check your deployed contract here:  
**https://mumbai.polygonscan.com/**

1. Paste your contract address into the search bar
2. You should see:
   - Contract code
   - Transaction history
   - All function calls

## Step 6: Start the Development Servers

```bash
c:\projects\bitcino\start-dev.bat
```

This will:
- ✅ Install Python dependencies
- ✅ Install Node.js dependencies
- ✅ Start backend at http://localhost:8000
- ✅ Start frontend at http://localhost:3000

## Step 7: Test the Full Flow

1. Open http://localhost:3000 in browser
2. Click "Connect MetaMask"
3. Select your wallet (with testnet MATIC)
4. Create a game and place a bet
5. Game uses:
   - Your MetaMask wallet for payments
   - Drand for random numbers (public, verifiable)
   - Smart contract for settlement (on-chain)

## Troubleshooting

### "Invalid RPC URL"
- Check RPC URL is: `https://rpc-mumbai.maticvigil.com`
- Make sure no extra spaces

### "Insufficient balance"
- Get testnet MATIC from faucet: https://faucet.polygon.technology/
- Wait for transaction to confirm (1-2 minutes)

### "Contract not found"
- Verify address in Polygonscan
- Make sure address is lowercase in .env files
- Redeploy if address is wrong

### "Private key rejected"
- Make sure it starts with `0x`
- Should be 66 characters total (0x + 64 hex digits)
- Don't share with anyone!

## Security Notes

### The test wallet is for development ONLY
- Use throwaway addresses
- Never use real private keys
- Never commit private keys to git
- .env files are in .gitignore (safe)

### Contract ownership
- Your wallet becomes the contract owner
- Can upgrade/migrate contract later if needed
- Can transfer ownership after testing

## Next Steps

Once everything is working:

1. **Run full integration tests** (Phase 5)
2. **Deploy to Polygon mainnet** (Phase 6)
3. **Launch publicly** (Phase 7)

---

**Need help deploying?** Check `contract/DEPLOY.md` for detailed deployment instructions.
