# Deploying Your Bitcino Instance

This guide walks you through deploying your own instance of the Bitcino Protocol.

## Three Key Concepts

1. **Template** (`template.json`) - Shows the structure any deployer uses
2. **Your Instance** (`your-instance.json`) - Your specific deployment
3. **Private Key** (`.env`) - Never committed, only for deployment

---

## Prerequisites

1. **Polygon Mumbai Testnet MATIC**
   - Fund your deployer account: [Faucet](https://faucet.polygon.technology/)
   - Need ~0.5 MATIC (for gas)

2. **Two Addresses**
   - `feeReceiver`: Receives 2% of all bets (usually your main wallet)
   - `serverWallet`: Authorized to settle bets (your server's address)
   - These MUST be different addresses

3. **Private Key**
   - Export from MetaMask or use an existing key
   - Store in `contract/.env` (gitignored, never committed)

---

## Step 1: Prepare Configuration

### Create `.env`

```bash
cd contract
cp .env.example .env
```

Edit `.env`:
```
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_without_0x_prefix
```

### Update `deployments/your-instance.json`

Choose your deployment pattern first:

**Pattern A: Single Operator** (Simpler)
```json
{
  "feeReceiver": "0x1234567890123456789012345678901234567890",
  "serverWallet": "0x1234567890123456789012345678901234567890",
  "pattern": "single-operator"
}
```
- One address does everything
- Simple management
- Less account overhead

**Pattern B: Delegated** (Recommended for larger ops)
```json
{
  "feeReceiver": "0x1111111111111111111111111111111111111111",
  "serverWallet": "0x2222222222222222222222222222222222222222",
  "pattern": "delegated"
}
```
- Separate business (fees) from operations (game settling)
- Better security isolation
- Cleaner account roles

Both patterns are fully supported by the contract. Choose what makes sense for your operation.

---

## Step 2: Install Dependencies

```bash
cd contract
npm install
```

---

## Step 3: Test (Optional but Recommended)

```bash
npm test
```

All tests should pass. This verifies the contract logic.

---

## Step 4: Deploy

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

### What the script does:

1. Reads `.env` for your private key
2. Reads `your-instance.json` for feeReceiver and serverWallet
3. Deploys contract to Mumbai
4. Outputs contract address
5. Creates `deployment.json` with deployment info

### Expected output:

```
🚀 Deploying BusterGame to Polygon...

Deployer account: 0xABC...

Configuration:
  Fee Receiver:   0x123...
  Server Wallet:  0x456...
  FEE_PERCENT:    2% (immutable)

✅ Deployment successful!

Contract Details:
  Address:        0xDEF...
  Network:        maticmum
  Fee Receiver:   0x123...
  Server Wallet:  0x456...
  FEE_PERCENT:    2%
```

---

## Step 5: Save Contract Address

Copy the contract address from the output. You'll need it for:
- **Server**: `server/.env` → `CONTRACT_ADDRESS=0xDEF...`
- **Frontend**: `frontend/.env.local` → `REACT_APP_CONTRACT_ADDRESS=0xDEF...`

---

## Step 6: Update Deployment Info

The script auto-creates `deployment.json`. Update `your-instance.json` with the actual values:

```json
{
  "name": "Bitcino Protocol - Your Instance",
  "network": "polygon-mumbai",
  "contractAddress": "0xDEF...",
  "feeReceiver": "0x123...",
  "serverWallet": "0x456...",
  "deployedAt": "2026-02-21T10:30:00Z",
  "verified": false
}
```

This file is **safe to commit** — it contains no private keys, only the public contract address and wallet addresses.

---

## Step 7: Verify on PolygonScan (Optional)

Visit [PolygonScan Mumbai](https://mumbai.polygonscan.com/) and search your contract address.

You should see:
- Contract deployment
- Constructor arguments (your addresses)
- All transactions

To verify source code on PolygonScan:
1. Get your `POLYGONSCAN_API_KEY`
2. Add to `.env`
3. Run: `npx hardhat verify --network mumbai <CONTRACT_ADDRESS> <FEE_RECEIVER> <SERVER_WALLET>`

---

## File Structure After Deployment

```
contract/
├── .env                          # Private key (gitignored) ✅
├── .env.example                  # Template (committed)
├── deployment.json               # Auto-generated after deploy
├── deployments/
│   ├── template.json            # Generic template
│   └── your-instance.json       # Your deployment (update with real addresses)
├── contracts/
│   └── BitcinoBetEscrow.sol
└── scripts/
    └── deploy.js
```

**Safe to commit:**
- `your-instance.json` (no secrets)
- `deployment.json` (no secrets)
- `.env.example` (template)

**Never commit:**
- `.env` (has private key)

---

## Troubleshooting

### "Insufficient funds"
- Add more testnet MATIC from [faucet](https://faucet.polygon.technology/)

### "Invalid private key"
- Remove `0x` prefix if present
- Ensure key is valid hex

### "Fee receiver and server wallet must be different"
- Use two different addresses

### Deployment times out
- Check RPC URL is accessible
- Ensure testnet MATIC in account

---

## Next: Using Your Contract

Once deployed, you have:

1. **Server Setup** (`server/`)
   - Set `CONTRACT_ADDRESS` in `.env`
   - Server can now interact with contract

2. **Frontend Setup** (`frontend/`)
   - Set `REACT_APP_CONTRACT_ADDRESS` in `.env.local`
   - Players can initiate bets

3. **Distribution**
   - Give others your `your-instance.json` (public info)
   - They can read from your contract
   - They cannot access your fees (only settleWager authorized)

---

## For Forkers: Creating Your Own Instance

If someone forks Bitcino to create their own instance:

1. Copy `contract/deployments/template.json`
2. Create their own `your-instance.json`
3. Run deployment with their addresses
4. Update all references across server/frontend

Each instance is independent. No conflicts between deployers.

---

## Security Checklist

✅ Private key in `.env` (gitignored)  
✅ No credentials in `your-instance.json`  
✅ Contract addresses public and auditable  
✅ Fee receiver and server wallet different  
✅ testnet verified before mainnet  

---

## Moving to Mainnet

Same steps, but:
1. Change network to `polygon` in scripts
2. Use mainnet RPC in `.env`
3. Use mainnet accounts (more valuable - be careful!)
4. Test thoroughly on testnet first

See [../DEPLOYMENT.md](../docs/DEPLOYMENT.md) for mainnet details.
