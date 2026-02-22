# Layer 2: Server

Python FastAPI backend handling game logic, matchmaking, and blockchain interactions.

## Overview

The server is the "game brain" but NOT the "fund holder". It:
- Runs game logic (dice rolls, random number generation)
- Matches players together
- Sends final results to the contract
- Can be replaced by anyone with an alternative implementation

## Architecture

```
app/
├── api/              # REST API routes
│   ├── bets.py      # Betting endpoints
│   ├── games.py     # Game state endpoints
│   └── players.py   # Player stats
├── game/             # Game logic
│   ├── dice.py      # Dice game implementation
│   └── randomness.py # RNG & verification
├── matching/         # Matchmaking algorithm
│   └── queue.py
├── blockchain/       # Contract interaction
│   └── web3_client.py
└── utils/            # Helpers
    └── config.py
```

## Setup

```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## Configuration

Create `.env`:
```
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
CONTRACT_ADDRESS=0x...
CONTRACT_ABI_PATH=../contract/artifacts/contracts/BitcinoBetEscrow.sol/BitcinoBetEscrow.json
PRIVATE_KEY=your_server_private_key
PORT=8000
DEBUG=false
```

## Running

```bash
python main.py
```

Server will start on `http://localhost:8000`

## Testing

```bash
pytest tests/
```

## API Specification

See [../docs/API_SPEC.md](../docs/API_SPEC.md)

## Randomness

Dice rolls are generated server-side with proper entropy. All results are hashed and stored for audit.

## Next Steps

1. Implement robust player matchmaking
2. Add rate limiting for security
3. Database for game history
4. WebSocket support for real-time updates
