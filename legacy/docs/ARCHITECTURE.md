# Buster Architecture

## System Overview

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React)              │
│         Wallet Connection + Game UI             │
│          (Dice Game Example)                    │
└──────────────────┬──────────────────────────────┘
                   │ HTTP REST API
┌──────────────────▼──────────────────────────────┐
│              Server (Python)                    │
│    Game Logic + Matchmaking + Randomness       │
└──────────────────┬──────────────────────────────┘
                   │ Web3.py
┌──────────────────▼──────────────────────────────┐
│   Smart Contract (Solidity - Polygon)          │
│    Escrow + Payout + Fund Management           │
└─────────────────────────────────────────────────┘
```

## Layer 1: Smart Contract

**Location**: `contract/`

Deployed on Polygon (MATIC token).

### Responsibilities
- Accept bets from two players
- Hold funds in escrow during game
- Receive winner decision from server
- Pay out 99% to winner, 1% to protocol deployer
- Emit events for transparency

### Key Contract: `BusterGame.sol`
- `placeBet(uint256 amount)`: Initiate a bet
- `settleWager(address winner, uint256 wagerID)`: Award winnings
- `withdraw()`: Claim accumulated protocol fees

---

## Layer 2: Server

**Location**: `server/`

Python backend orchestrating all game logic and blockchain interactions.

### Core Modules

```
app/
├── game/          # Dice, slots, match-3 logic
├── matching/      # Player pairing algorithm
├── blockchain/    # Contract interaction via Web3.py
├── api/           # REST endpoints
└── utils/         # Helpers, randomness verification
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/bet/place` | Player initiates bet |
| POST | `/game/join` | Player enters matchmaking |
| GET | `/game/{id}` | Get game state |
| POST | `/game/{id}/roll` | Roll dice (game action) |
| GET | `/player/{addr}` | Player stats |

---

## Layer 3: Frontend

**Location**: `frontend/`

React application for player interaction.

### Core Features
- MetaMask wallet integration (Web3.js)
- Dice game UI
- Bet placement form
- Real-time game updates
- Results & payout display

### Key Components
- `WalletConnect`: MetaMask integration
- `BetForm`: Bet amount input
- `DiceGame`: Game board & rolling mechanics
- `Results`: Winner display & payout confirmation

---

## Player Flow

```
1. Player connects wallet via MetaMask
2. Enters bet amount on frontend
3. Approves MATIC spend + initiates bet
4. Contract receives funds (locked in escrow)
5. Server matches with opponent
6. Game runs entirely on server
7. Server sends winner to contract
8. Contract transfers funds automatically
9. Frontend displays result
```

---

## Security Model

- **Fund Security**: Contract holds all player funds, not the server
- **Server Trust**: Server can be replaced at any time
- **Transparency**: All transactions recorded on Polygon
- **Incentive**: Deployer earns 1% of settled bets (aligned interest)

---

## Deployment Variants

Any entity can deploy this protocol independently:

1. Deploy contract to Polygon
2. Run their own server instance
3. Build their own frontend
4. Keep their own 1% fees

This creates a **competitive market** where quality UX + fair games win players.
