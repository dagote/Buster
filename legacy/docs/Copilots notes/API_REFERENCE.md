# API Reference - Drand-Integrated Endpoints

## Overview
The Bitcino Protocol API now uses **Drand for verifiable randomness**. This document specifies the current endpoints after Phase 3 completion.

## Base URL
```
http://localhost:8000  (development)
https://api.bitcino.io (production - Phase 6)
```

## Endpoints

### 1. Place a Bet
**Endpoint:** `POST /api/bet/place`

Create a new bet and become player 1.

```json
Request:
{
  "amount": 100,
  "player_address": "0x1234567890123456789012345678901234567890"
}

Response (200 OK):
{
  "bet_id": 42,
  "player1": "0x1234567890123456789012345678901234567890",
  "player2": "0x0000000000000000000000000000000000000000",
  "amount": 100,
  "status": "Pending",
  "game_type": 1,
  "tx_hash": "0xabc123def456...",
  "message": "Bet placed, waiting for player 2"
}

Errors:
- 400 Bad Request: Invalid player address
- 400 Bad Request: Invalid amount
- 500 Internal Server Error: Contract call failed
```

### 2. Join a Bet
**Endpoint:** `POST /api/bet/join`

Join an existing bet as player 2 and make it Active.

```json
Request:
{
  "bet_id": 42,
  "amount": 100,
  "player_address": "0x9876543210987654321098765432109876543210"
}

Response (200 OK):
{
  "bet_id": 42,
  "status": "Active",
  "player1": "0x1234567890123456789012345678901234567890",
  "player2": "0x9876543210987654321098765432109876543210",
  "amount": 100,
  "tx_hash": "0xdef456abc123...",
  "message": "Bet is now Active, ready to play"
}

Errors:
- 400 Bad Request: Invalid bet_id
- 400 Bad Request: Bet is not Pending
- 400 Bad Request: Joining player must be different from player 1
- 500 Internal Server Error: Contract call failed
```

### 3. Play Game (Drand Settlement)
**Endpoint:** `POST /api/game/play` ⭐ **NEW - Uses Drand**

Play the dice game and settle using Drand randomness.

```json
Request:
{
  "bet_id": 42,
  "player_address": "0x1234567890123456789012345678901234567890"
}

Response (200 OK):
{
  "status": "settled",
  "message": "Player 1 wins with 5 vs 2",
  "bet_id": 42,
  "player1_roll": 5,
  "player2_roll": 2,
  "winner_is_player": 1,
  "tx_hash": "0x1234567890abcdef...",
  "drand_round": 8739,
  "drand_value": 999888777
}

Errors:
- 404 Not Found: Bet not found
- 400 Bad Request: Bet is not active
- 400 Bad Request: Invalid player address
- 503 Service Unavailable: Failed to fetch Drand
- 500 Internal Server Error: Settlement failed
```

**Important Notes:**
- This endpoint **automatically fetches the latest Drand round**
- Winner is calculated **on-chain from Drand value** (not passed by server)
- Outcome is **100% deterministic** - same Drand round, same winner
- Event `BetSettledWithDrand` emitted with full audit trail
- **Verification**: Visit `drandbeacon.io/round/{drand_round}` to verify outcome

### 4. Get Bet Details
**Endpoint:** `GET /api/bet/{bet_id}`

Retrieve details of a specific bet.

```json
Request:
GET /api/bet/42

Response (200 OK):
{
  "bet_id": 42,
  "player1": "0x1234567890123456789012345678901234567890",
  "player2": "0x9876543210987654321098765432109876543210",
  "amount": 100,
  "status": 2,  // 0=Pending, 1=Active, 2=Settled, 3=Canceled
  "winner": "0x1234567890123456789012345678901234567890",
  "settled_at": 1700000000,
  "game_type": 1
}

Errors:
- 404 Not Found: Bet not found
```

### 5. Get Claimable Balance
**Endpoint:** `GET /api/player/{address}/balance`

Get winnings available to claim for a player.

```json
Request:
GET /api/player/0x1234567890123456789012345678901234567890/balance

Response (200 OK):
{
  "address": "0x1234567890123456789012345678901234567890",
  "claimable_balance": 294,
  "wei": "294000000000000000000",
  "token": "MATIC"
}

Errors:
- 400 Bad Request: Invalid address
```

### 6. Claim Winnings
**Endpoint:** `POST /api/player/claim`

Withdraw claimable balance to wallet.

```json
Request:
{
  "player_address": "0x1234567890123456789012345678901234567890",
  "amount": 294
}

Response (200 OK):
{
  "status": "success",
  "player_address": "0x1234567890123456789012345678901234567890",
  "amount_claimed": 294,
  "tx_hash": "0x1234567890abcdef...",
  "remaining_balance": 0,
  "message": "Withdrawal successful"
}

Errors:
- 400 Bad Request: Invalid address
- 400 Bad Request: Insufficient balance
- 500 Internal Server Error: Withdrawal failed
```

## Example Game Flow

### Complete Game Walkthrough

```
1. PLAYER A - Place Bet
   POST /api/bet/place
   {
     "amount": 100,
     "player_address": "0xAAAA..."
   }
   ← bet_id: 42, status: Pending

2. PLAYER B - Join Bet
   POST /api/bet/join
   {
     "bet_id": 42,
     "amount": 100,
     "player_address": "0xBBBB..."
   }
   ← status: Active (ready to play)

3. ANYONE - Play Game
   POST /api/game/play
   {
     "bet_id": 42,
     "player_address": "0xAAAA..." (or 0xBBBB...)
   }
   ├─ Server fetches latest Drand
   │  Drand Round: 8739
   │  Drand Value: 999888777
   │
   ├─ Server derives rolls (deterministically)
   │  Player A Roll: (999888777 % 6) + 1 = 6
   │  Player B Roll: ((999888777 >> 8) % 6) + 1 = 1
   │
   ├─ Server calls contract.settleWagerWithDrand()
   │  Contract derives SAME rolls (verifiable)
   │  Contract pays Player A: 196 (98 wei out of 200)
   │  Contract pays fee receiver: 4 (2% of 200)
   │
   ← Response:
   {
     "status": "settled",
     "message": "Player 1 wins with 6 vs 1",
     "player1_roll": 6,
     "player2_roll": 1,
     "winner_is_player": 1,
     "tx_hash": "0x...",
     "drand_round": 8739,
     "drand_value": 999888777
   }

4. ANYONE - Verify Outcome (Optional but recommended)
   - Visit: https://drandbeacon.io/round/8739
   - Check: randomness = 999888777 ✓
   - Calculate: (999888777 % 6) + 1 = 6 ✓
   - Verify: Contract event matches calculated rolls ✓
   - Confirm: Outcome is deterministic and public ✓

5. PLAYER A - Claim Winnings
   POST /api/player/claim
   {
     "player_address": "0xAAAA...",
     "amount": 196
   }
   ← Transferred to Player A's wallet
```

## Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Bet placed, game played, withdrawal successful |
| 400 | Bad Request | Invalid address, insufficient balance |
| 404 | Not Found | Bet ID doesn't exist |
| 500 | Server Error | Contract call failed, unexpected exception |
| 503 | Service Unavailable | Drand beacon unreachable |

## Error Handling

All endpoints return errors in this format:

```json
{
  "detail": "Human-readable error message"
}
```

Example:
```json
HTTP 503

{
  "detail": "Failed to fetch Drand: Connection refused"
}
```

## Rate Limits

- **Development**: No limits
- **Production**: TBD (Phase 6)

## Authentication

- **Development**: None (open API)
- **Production**: TBD (Phase 6, possibly API keys)

## CORS

- **Development**: Enabled for `localhost:3000` (React frontend)
- **Production**: TBD (configure for your domain)

## Server Layer Architecture

### Directory Structure
```
server/
├─ main.py                           # FastAPI application entry point
├─ requirements.txt                  # Python dependencies
├─ .env.example                      # Configuration template
│
├─ app/
│  ├─ __init__.py                    # Package initialization
│  │
│  ├─ config.py                      # Settings from environment variables
│  │  └─ polygon_rpc_url
│  │  └─ contract_address
│  │  └─ server_private_key
│  │  └─ drand_use_mainchain
│  │
│  ├─ randomness/                    # ⭐ Drand integration
│  │  └─ __init__.py
│  │     ├─ DrandClient (async)
│  │     │  ├─ get_latest()          # Fetch latest Drand round
│  │     │  ├─ get_by_round(n)       # Fetch specific round
│  │     │  ├─ wait_for_round(n)     # Wait for future round
│  │     │  └─ randomness_to_int()   # Convert hex to uint256
│  │     │
│  │     └─ DrandClientSync (sync)
│  │        └─ Blocking wrapper for FastAPI endpoints
│  │
│  ├─ game/                          # ⭐ Game logic
│  │  └─ __init__.py
│  │     └─ DiceGame
│  │        └─ derive_rolls_from_drand(drand_value)
│  │           ├─ player1_roll = (drand_value % 6) + 1
│  │           ├─ player2_roll = ((drand_value >> 8) % 6) + 1
│  │           ├─ winner (highest roll)
│  │           └─ message (human-readable)
│  │
│  ├─ blockchain/                    # ⭐ Web3 contract interaction
│  │  └─ __init__.py
│  │     └─ BlockchainClient
│  │        ├─ settle_wager_with_drand()  # Primary: Drand settlement
│  │        ├─ settle_wager()             # Legacy: Direct settlement
│  │        ├─ get_bet()                  # Fetch bet details
│  │        ├─ get_balance()              # Check claimable balance
│  │        ├─ get_escrow_total()         # Total locked funds
│  │        ├─ get_fee_percent()          # Should always be 2
│  │        ├─ get_fee_receiver()         # Fee recipient address
│  │        └─ get_server_wallet()        # Server settlement address
│  │
│  ├─ api/                           # ⭐ REST endpoints
│  │  └─ __init__.py
│  │     ├─ POST /api/bet/place          # Create bet (player 1)
│  │     ├─ POST /api/bet/join           # Join bet (player 2)
│  │     ├─ POST /api/game/play          # Play game (Drand-based)
│  │     ├─ GET /api/bet/{bet_id}        # Get bet details
│  │     ├─ GET /api/player/{addr}/balance  # Check winnings
│  │     └─ POST /api/player/claim       # Claim winnings
│  │
│  ├─ utils/                         # Helper functions
│  │  └─ __init__.py
│  │     ├─ validate_eth_address()
│  │     └─ wei_to_ether() / ether_to_wei()
│  │
│  └─ matching/                      # Queue management (optional)
│     └─ __init__.py
│        └─ Match players for bets
│
└─ tests/                            # Unit tests
   └─ test_*.py
```

### Module Dependencies

```
main.py (FastAPI)
  ├─ app.api (REST endpoints)
  │  ├─ app.config (settings)
  │  ├─ app.blockchain (Web3)
  │  │  ├─ eth_account
  │  │  ├─ web3
  │  │  └─ (contract ABI from file)
  │  │
  │  ├─ app.randomness (Drand client)
  │  │  └─ httpx (async HTTP)
  │  │
  │  └─ app.game (game logic)
  │     └─ (pure Python, no external deps)
  │
  └─ (FastAPI, Pydantic)
```

### Data Flow Through Server

```
REST Request
  ↓
[API Layer] app/api/__init__.py
  ├─ Validate request
  ├─ Call appropriate handler
  └─ Return response
  ↓
[Game Layer] app/game/__init__.py (if /api/game/play)
  ├─ derive_rolls_from_drand()
  └─ Calculate outcome deterministically
  ↓
[Randomness Layer] app/randomness/__init__.py (if /api/game/play)
  ├─ DrandClientSync.get_latest()
  └─ Fetch public Drand randomness
  ↓
[Blockchain Layer] app/blockchain/__init__.py (if /api/game/play or settle)
  ├─ settle_wager_with_drand()
  ├─ Build transaction
  ├─ Sign with server wallet
  └─ Send to contract
  ↓
[Config Layer] app/config.py (global settings)
  └─ Environment variables (contract address, RPC URL, etc)
  ↓
REST Response (JSON)
```

### Key Implementation Details

#### Randomness Module (`app/randomness/__init__.py`)
```python
# Async interface (for production)
client = DrandClient(use_mainchain=True)
data = await client.get_latest()
# Returns: {"round": 8739, "randomness": "0x...", "signature": "0x...", "timestamp": ...}

# Sync interface (for FastAPI)
client = DrandClientSync(use_mainchain=True)
data = client.get_latest()
int_value = client.randomness_to_int(data["randomness"])
```

#### Game Logic Module (`app/game/__init__.py`)
```python
# Pure function, no side effects
result = DiceGame.derive_rolls_from_drand(999888777)
# Returns: {
#   "player1_roll": 6,
#   "player2_roll": 1,
#   "winner": 1,
#   "message": "Player 1 wins with 6 vs 1"
# }
```

#### Blockchain Module (`app/blockchain/__init__.py`)
```python
# Get client (singleton)
client = get_blockchain_client()

# Settle with Drand (primary method)
result = client.settle_wager_with_drand(
    bet_id=42,
    drand_round=8739,
    drand_value=999888777
)
# Returns: {"tx_hash": "0x...", "status": "success", "gas_used": 55000, ...}

# Fetch bet details
bet = client.get_bet(42)
# Returns: {"betId": 42, "player1": "0x...", "player2": "0x...", "status": 1, ...}
```

#### API Module (`app/api/__init__.py`)
```python
# /api/game/play endpoint (Drand-based settlement)
@router.post("/api/game/play")
async def play_game(request: PlayGameRequest):
    # 1. Validate bet is Active
    # 2. Fetch latest Drand
    # 3. Derive rolls from Drand
    # 4. Call contract.settleWagerWithDrand()
    # 5. Return result with audit trail
```

### Configuration (`.env` example)

```bash
# Polygon Network
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
CONTRACT_ABI_PATH=../contract/artifacts/BitcinoBetEscrow.json

# Server Operations
SERVER_PRIVATE_KEY=0xabcdef...
SERVER_ADDRESS=0x1234567890123456789012345678901234567890

# Drand Configuration
DRAND_USE_MAINCHAIN=true  # false for testnet

# Server
HOST=0.0.0.0
PORT=8000
```

### Running the Server

```bash
# 1. Install dependencies
cd server
pip install -r requirements.txt

# 2. Create .env file
cp .env.example .env
# Edit .env with your values

# 3. Start server
python3 main.py
# Server runs on http://localhost:8000

# 4. Test endpoints
curl http://localhost:8000/api/bet/1
```

### Testing the Server

```bash
# Check imports compile
python3 -m py_compile app/randomness/__init__.py
python3 -m py_compile app/game/__init__.py
python3 -m py_compile app/blockchain/__init__.py
python3 -m py_compile app/api/__init__.py

# Test game logic
python3 -c "from app.game import DiceGame; print(DiceGame.derive_rolls_from_drand(999888777))"

# Test Drand client
python3 -c "from app.randomness import DrandClientSync; print(DrandClientSync().get_latest())"
```

---

## Drand Integration Details

### What Is Drand?
- **Free**: Uses public Drand service
- **Verifiable**: Randomness is publicly auditable
- **Deterministic**: Same round = same value, always
- **Transparent**: Anyone can verify outcome at drandbeacon.io

### How It Works
1. Server receives `/api/game/play` request
2. Server fetches **latest Drand round**
3. Server gets randomness value (hex/int)
4. Server calculates rolls (deterministically)
5. Server sends `settleWagerWithDrand(bet_id, drand_round, drand_value)` to contract
6. **Contract** derives same rolls (identical formula)
7. **Contract** determines winner (on-chain, immutable)
8. **Contract** emits event with drand_round, drand_value, rolls (audit trail)
9. Server returns result + drand data
10. **Anyone** can verify by visiting drandbeacon.io/round/{drand_round}

### Why Drand?

| System | Cost | Trust | Verifiable | Selected? |
|--------|------|-------|------------|-----------|
| Chainlink VRF | $0.25/game | Chainlink | Yes | ❌ Too expensive |
| Server RNG | Free | Server | No | ❌ Not verifiable |
| Commit-Reveal | Free | Players | Yes | ❌ Complex UX |
| Drand | Free | Math/Crypto | Yes | ✅ Selected |

## Deployment Versions

### Current (Phase 3)
- ✅ All endpoints available
- ✅ Drand integration active
- ✅ Testnet only (Mumbai)
- ⏳ Frontend (Phase 4)

### Next (Phase 4)
- ✅ React frontend
- ✅ MetaMask integration
- ✅ E2E testing

### Future (Phase 6)
- ✅ Mainnet deployment
- ✅ Production infrastructure
- ✅ Monitoring/alerting

## Testing Endpoints with curl

```bash
# 1. Place a bet
curl -X POST http://localhost:8000/api/bet/place \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "player_address": "0x1234567890123456789012345678901234567890"}'

# 2. Join the bet
curl -X POST http://localhost:8000/api/bet/join \
  -H "Content-Type: application/json" \
  -d '{"bet_id": 42, "amount": 100, "player_address": "0x9876543210987654321098765432109876543210"}'

# 3. Play game (uses REAL Drand)
curl -X POST http://localhost:8000/api/game/play \
  -H "Content-Type: application/json" \
  -d '{"bet_id": 42, "player_address": "0x1234567890123456789012345678901234567890"}'

# 4. Get bet details
curl http://localhost:8000/api/bet/42

# 5. Check balance
curl http://localhost:8000/api/player/0x1234567890123456789012345678901234567890/balance

# 6. Claim winnings
curl -X POST http://localhost:8000/api/player/claim \
  -H "Content-Type: application/json" \
  -d '{"player_address": "0x1234567890123456789012345678901234567890", "amount": 294}'
```

## Frontend Integration Example

```javascript
// React component calling API
async function playGame(betId, playerAddress) {
  const response = await fetch('http://localhost:8000/api/game/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bet_id: betId,
      player_address: playerAddress
    })
  });

  const result = await response.json();
  
  if (!response.ok) {
    alert(`Error: ${result.detail}`);
    return;
  }

  // Display result
  console.log(`${result.message}`);
  console.log(`Rolls: ${result.player1_roll} vs ${result.player2_roll}`);
  console.log(`Winner: Player ${result.winner_is_player}`);
  
  // Let user verify at Drand
  console.log(`Verify at: https://drandbeacon.io/round/${result.drand_round}`);
  
  return result;
}
```

---

**Status**: ✅ Phase 3 Complete - All Drand endpoints ready for use.

**Next**: Phase 4 Frontend Development (React + MetaMask)
