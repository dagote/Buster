# Bitcino Quick Start

Get the full protocol running locally in 3 steps.

## Prerequisites

- Node.js 16+
- Python 3.9+
- Git
- MetaMask wallet (for testnet)

## Step 1: Deploy Smart Contract to Polygon Mumbai

```bash
cd contract
npm install
npx hardhat run scripts/deploy.js --network mumbai
# Save the contract address!
```

## Step 2: Start the Server

```bash
cd server
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
# Server running on http://localhost:8000
```

## Step 3: Run the Frontend

```bash
cd frontend
npm install
npm start
# App running on http://localhost:3000
```

## Testing the Flow

1. Open http://localhost:3000 in your browser
2. Connect MetaMask (ensure Mumbai testnet is selected)
3. Enter a bet amount
4. Wait for opponent matchmaking
5. Play the dice game
6. Results posted on-chain automatically

---

## Troubleshooting

### Contract deployment fails
- Ensure you have Mumbai testnet funds (get from faucet)
- Check `contract/.env` has correct private key

### Server crashes
- Install all Python dependencies: `pip install -r requirements.txt`
- Ensure port 8000 is free

### Frontend won't connect
- Check server is running on localhost:8000
- Clear browser cache and reload
