# Buster Server - Quick Start

Get the server running in 5 minutes.

## Prerequisites

- Python 3.9+
- Contract deployed to Polygon Mumbai
- Contract address (from `contract/deployment.json`)
- Server wallet address & private key

## 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Configure (2 min)

```bash
cp .env.example .env
```

Edit `.env`:
```
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
CONTRACT_ADDRESS=0x...          # From contract deployment
CONTRACT_ABI_PATH=../contract/artifacts/contracts/BitcinoBetEscrow.sol/BitcinoBetEscrow.json
SERVER_PRIVATE_KEY=abc123...    # Your server wallet private key (no 0x)
SERVER_WALLET_ADDRESS=0x...     # Should match contract deployment
PORT=8000
DEBUG=true
```

### Step 3: Run (30 sec)

```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 4: Verify (1 min)

Open browser or curl:
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "contract_address": "0x...",
  "fee_percent": 2,
  "escrow_total_wei": 0,
  "escrow_total_matic": 0
}
```

### Step 5: Explore API (30 sec)

Open: `http://localhost:8000/docs`

You'll see interactive API documentation (Swagger UI).

---

## What's Running?

✅ FastAPI server on port 8000  
✅ Connected to Polygon Mumbai testnet  
✅ Connected to your contract  
✅ Ready to receive bets from frontend  

## Next Steps

1. **Frontend Setup** (Phase 4)
   - Deploy contract if not done
   - Run frontend React app
   - Connect MetaMask

2. **Test a Bet**
   - Player A places bet via frontend
   - Player B joins via frontend
   - Server settles on-chain

3. **Troubleshooting**
   - Check `.env` values match contract
   - Ensure contract ABI file exists
   - Verify RPC URL is accessible

---

## Common Issues

**"Failed to connect to Polygon RPC"**
```
→ Check POLYGON_RPC_URL in .env
→ Test: curl https://rpc-mumbai.maticvigil.com -d "..."
```

**"Contract ABI not found"**
```
→ Make sure contract is compiled: cd contract && npx hardhat compile
→ Check CONTRACT_ABI_PATH points to correct file
```

**"settle_wager fails"**
```
→ Verify SERVER_WALLET_ADDRESS matches contract deployment
→ Check SERVER_PRIVATE_KEY is correct (no 0x prefix)
→ Ensure server wallet has testnet MATIC for gas
```

---

## Development vs Production

**Development (.env)**:
```
DEBUG=true
ENVIRONMENT=development
```

**Production**:
```
DEBUG=false
ENVIRONMENT=production

# Change RPC and contract address to mainnet:
POLYGON_RPC_URL=https://polygon-rpc.com
CONTRACT_ADDRESS=0x... (mainnet contract)
```

---

You're ready! Proceed to Phase 4 (Frontend) or deploy the contract if not done.
