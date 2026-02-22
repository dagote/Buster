# Bitcino Server - Architecture Overview

## System Design

The Bitcino server is intentionally **lightweight** and **stateless**:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│                MetaMask Wallet Integration                  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP REST API
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                   Buster Server (FastAPI)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Layer (FastAPI Routes)                          │  │
│  │  - /api/bet/place                                    │  │
│  │  - /api/bet/join                                     │  │
│  │  - /api/game/play                                    │  │
│  │  - /api/player/{address}                             │  │
│  │  - /api/contract/info                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                             │                                │
│  ┌──────────────────────────┴──────────────────────────┐  │
│  │  Service Layer                                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Game Service (DiceGame)                     │   │  │
│  │  │ - play()                                    │   │  │
│  │  │ - roll_die()                                │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Matchmaking Service                         │   │  │
│  │  │ - add_player()                              │   │  │
│  │  │ - find_match()                              │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Blockchain Service (Web3.py)               │   │  │
│  │  │ - settle_wager()                            │   │  │
│  │  │ - get_bet()                                 │   │  │
│  │  │ - get_balance()                             │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                             │                                │
│  ┌──────────────────────────┴──────────────────────────┐  │
│  │  Utils Layer                                         │  │
│  │  - Address validation                               │  │
│  │  - Wei conversion                                    │  │
│  │  - Signature verification                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────┬────────────────────────────────┘
                              │ Web3 RPC Calls
                              ↓
                    ┌──────────────────────┐
                    │  Polygon Blockchain  │
                    │  Smart Contract      │
                    │  (BitcinoBetEscrow)  │
                    └──────────────────────┘
```

## Data Flow: Place & Settle a Bet

```
STEP 1: Player A Places Bet
─────────────────────────────
Player A (Frontend)
    │
    ├─ Approve MATIC spend (MetaMask popup)
    │
    ├─ Call contract.placeBet(amount) via Web3.js
    │    │
    │    └─ Smart Contract receives MATIC
    │        │
    │        └─ Emits BetPlaced event
    │            │
    │            └─ betId = 1 returned
    │
    └─ POST /api/bet/place
         │
         └─ Server tracks it

STEP 2: Player B Joins
──────────────────────
Player B (Frontend)
    │
    ├─ Call contract.joinBet(1, amount) via Web3.js
    │    │
    │    └─ Smart Contract receives MATIC
    │        │
    │        └─ Emits BetJoined event
    │            │
    │            └─ Bet status changes to Active
    │
    └─ POST /api/bet/join
         │
         └─ Server adds to game

STEP 3: Play & Settle
─────────────────────
Server generates game result
    │
    └─ POST /api/game/play (from client or backend trigger)
         │
         ├─ DiceGame.play()
         │  │
         │  └─ Returns { player1_roll, player2_roll, winner }
         │
         ├─ Determine winner address
         │
         └─ contract.settleWager(betId, winnerAddress)
              │
              └─ Smart Contract
                  │
                  ├─ Calculates: total_pool = 2 × amount
                  ├─ Calculates: fee = pool × 2%
                  ├─ Calculates: winner_payout = pool - fee
                  │
                  ├─ Updates claimableBalance[winner]
                  ├─ Updates claimableBalance[feeReceiver]
                  │
                  └─ Emits BetSettled event

STEP 4: Withdraw Winnings
──────────────────────────
Winner (Frontend)
    │
    └─ Call contract.withdraw() via Web3.js
         │
         └─ Smart Contract
             │
             ├─ Transfer winner_payout MATIC to player
             │
             └─ Emit BalanceWithdrawn event
```

## Module Responsibilities

### `blockchain/__init__.py` (Web3 Client)
**Trustless Fund Management**

Responsible for:
- Connecting to Polygon RPC
- Loading contract ABI & address
- Calling `settleWager()` on-chain
- Reading contract state (bets, balances)
- Managing server's private key

Key invariant: **Server never touches player funds**. It only:
1. Calls `settleWager()` with winner address
2. Reads contract state

The contract handles all actual fund transfers.

### `game/__init__.py` (Game Logic)
**Deterministic Game Outcomes**

Responsible for:
- Dice game implementation
- Roll generation
- Winner determination
- Game state (rolls, results)

Key property: Results are deterministic based on randomness, but immutable once settled on-chain.

### `matching/__init__.py` (Matchmaking)
**Player Pairing**

Responsible for:
- FIFO queue of waiting players
- Finding matches by game type
- Queue management

Current MVP uses in-memory queue. Production could use:
- Redis for distributed systems
- ELO-based matching
- Skill tiers

### `api/__init__.py` (REST Endpoints)
**Frontend Communication**

Responsible for:
- Accepting HTTP requests
- Validating inputs
- Delegating to services
- Returning JSON responses

Does NOT:
- Hold funds
- Make transaction decisions alone
- Bypass contract rules

### `utils/__init__.py` (Helpers)
**Common Utilities**

Provides:
- Address validation
- Signature verification
- Wei ↔ MATIC conversion
- Ethereum utilities

## Key Design Decisions

### 1. Stateless Services
Server holds **no persistent state**:
- All bets stored on-chain (contract is source of truth)
- In-memory matching queue for MVP
- No user sessions or login

### 2. Contract Privacy
Server maintains **separation**:
- Server's private key only used for `settleWager()`
- Cannot modify contract rules
- Cannot access player funds directly
- Cannot override game results without contract

### 3. Frontend Ownership
Frontend **owns the UX**:
- MetaMask integration lives in frontend
- Frontend calls contract directly for:
  - `placeBet()`
  - `joinBet()`
  - `withdraw()`
- Frontend calls server for:
  - Game logic execution
  - Matchmaking coordination
  - Getting contract state

### 4. Minimal External Dependencies
Uses only production-ready libraries:
- FastAPI (async REST API)
- Web3.py (Ethereum interaction)
- Pydantic (data validation)
- NO custom DAO or ORM
- NO external payment processors

## Scalability Path

**MVP (Current)**:
- In-memory matchmaking queue
- Single server instance
- Synchronous game processing
- HTTP REST API

**Phase 2 (Growth)**:
- Redis for distributed queue
- Horizontal server scaling
- WebSocket for real-time updates
- Database for game history

**Phase 3 (Enterprise)**:
- Kafka for event streaming
- Microservices for each game type
- gRPC for inter-service communication
- Analytics engine

Key: Each upgrade is **optional**. Protocol works with just HTTP + contract.

## Security Considerations

### Private Keys
- Stored in `.env` (never committed)
- Used only for `settleWager()`
- Consider HSM/KMS for production

### Input Validation
- Ethereum addresses verified before use
- Amounts checked against min/max
- Game IDs validated against contract

### Rate Limiting
- IP-based rate limits on endpoints (add in production)
- Per-player limits on rapid bets

### CORS
- Currently allows all origins
- Restrict to frontend domain in production

## Testing Strategy

**Unit Tests**:
- Game logic (determinism)
- Utilities (conversions, validation)
- Matchmaking (queue operations)

**Integration Tests** (future):
- Full game flow
- Contract interaction
- Settlement verification

**End-to-End Tests** (future):
- Frontend → Server → Contract
- Load testing
- Chaos testing (connection failures)

---

**Architecture is intentionally simple and modular.** Each component can be replaced or upgraded without breaking the protocol.
