# Phase 5: Mainnet Validation & Randomness Scalability

**Status:** PLANNING  
**Environment:** Polygon Mainnet (LIVE)  
**Objective:** Execute 1 complete game, validate on-chain, solve randomness scalability, build public API  

---

## Current State Assessment

### What's Ready
✅ Smart contract deployed on mainnet  
✅ Backend API running (6 endpoints)  
✅ Frontend UI built (React)  
✅ Drand integration complete  
✅ Game logic deterministic  

### What's Missing
⚠️ Live mainnet game execution (never run end-to-end on mainnet)  
⚠️ On-chain validation proof (haven't checked contract state)  
⚠️ Randomness scalability formula (only works for 1-12 range)  
⚠️ Atomic API commands (current endpoints are compound)  
⚠️ Public outcome verification system (no shareable proof format)  

---

## Testing Roadmap (Realistic Order)

### PHASE 5.1: Foundation Setup (Day 1)
**Goal:** Prepare environment and tooling for mainnet testing

#### 5.1.1: Mainnet Configuration Validation
```bash
# Verify contract settings
✓ Contract address on mainnet
✓ Fee receiver configured correctly
✓ Server wallet has funds (for gas)
✓ RPC endpoints responding
```

**Deliverable:** [MAINNET_CONFIG.md](MAINNET_CONFIG.md) - Network settings checklist

---

### PHASE 5.2: Randomness Scalability Architecture (Day 1-2)
**Goal:** Generalize randomness formula for ANY outcome space

#### 5.2.1: The Generalized Formula

Current (hardcoded for 1-12):
```javascript
diceTotal = (drandValue % 12) + 1
```

**Generalized (for any outcome space):**
```javascript
// For ANY range [min, max]
function deriveOutcome(drandValue, min, max) {
  const range = max - min + 1;
  return (drandValue % range) + min;
}

// Examples:
deriveOutcome(123456, 1, 12)      // 1-12 (two dice)
deriveOutcome(123456, 1, 100)     // 1-100 (percentiles)
deriveOutcome(123456, 1, 6)       // 1-6 (single die)
deriveOutcome(123456, 0, 1)       // 0-1 (coin flip)
deriveOutcome(123456, 1, 52)      // 1-52 (card index)
```

#### 5.2.2: Multi-Seed Randomness (for >1 outcome needed)

**For multiple independent random numbers from single Drand round:**

```javascript
// Hash the Drand value + index to get independent streams
function deriveOutcomeWithIndex(drandValue, index, min, max) {
  // sha256(drandValue + "|" + index) gives different value per index
  const hashedValue = sha256(`${drandValue}|${index}`);
  const range = max - min + 1;
  return (BigInt(hashedValue) % BigInt(range)) + BigInt(min);
}

// For multi-round game:
round1Dice = deriveOutcomeWithIndex(drand.value, 0, 1, 12)
round2Dice = deriveOutcomeWithIndex(drand.value, 1, 1, 12)
round3Dice = deriveOutcomeWithIndex(drand.value, 2, 1, 12)
// All from SAME Drand round, different outcomes
```

#### 5.2.3: Scalability Properties

| Property | Formula | Proof |
|----------|---------|-------|
| **Determinism** | `(seed % range) + min` always same | Pure math |
| **Fairness** | Distribution uniform over range | Modulo property |
| **Independence** | sha256 per index uncorrelated | Cryptographic hash |
| **Verifiability** | Anyone can compute | Public formula |
| **Gas Efficiency** | Can be on-chain or off-chain | No external calls |

**Deliverable:** [RANDOMNESS_SCALABILITY.md](RANDOMNESS_SCALABILITY.md) - Complete math documentation

---

### PHASE 5.3: Atomic API Commands (Day 2)
**Goal:** Break down compound endpoints into atomic operations

#### 5.3.1: Current (Compound) API

```
POST /bet/place          ← Creates bet + locks funds (2 operations)
POST /bet/join           ← Joins bet + locks funds (2 operations)
POST /game/play          ← Plays round + fetches Drand + settles on-chain (3 operations)
GET /bet/{id}            ← Fetches everything combined
```

#### 5.3.2: Proposed Atomic API

**Level 1: Core Operations (atomic, stateless)**

```
POST   /random/derive
  Input:  { seed: string, min: int, max: int, index?: int }
  Output: { value: int, formula: string, verifiable: bool }
  Example: GET /random/derive?seed=0xabc123&min=1&max=12&index=0
  → { value: 7, formula: "(0xabc123 % 12) + 1", verifiable: true }

POST   /outcome/verify
  Input:  { drandRound: int, drandValue: string, claimedOutcome: int, min: int, max: int }
  Output: { valid: bool, derivedOutcome: int, proof: object }
  → Verify published outcome matches Drand publicly
```

**Level 2: Game Operations (stateful)**

```
POST   /bet/create
  Input:  { player: address, amount: string, gameType: string }
  Output: { betId: string, contractTxHash: string, status: "funding_locked" }
  Action: Creates bet, locks player1 funds in contract

POST   /bet/join
  Input:  { betId: string, player: address, amount: string }
  Output: { betId: string, contractTxHash: string, status: "both_funded" }
  Action: Joins existing bet, locks player2 funds

POST   /game/round
  Input:  { betId: string, playerAddress: address, roundNum: int }
  Output: { roundNum: int, drandRound: int, drandValue: string, playerOutcome: int, opponentOutcome: int }
  Action: Fetches Drand, derives outcomes (doesn't settle yet)

POST   /game/settle
  Input:  { betId: string, roundNum: int, drandRound: int, drandValue: string }
  Output: { roundWinner: address, contractTxHash: string, roundScore: {p1: int, p2: int} }
  Action: Submits to contract, records winner

POST   /game/claim
  Input:  { betId: string, playerAddress: address }
  Output: { winnings: string, contractTxHash: string, status: "claimed" }
  Action: Transfers winnings from contract to player
```

**Level 3: Query Operations (read-only)**

```
GET    /bet/{betId}
  Output: BetDetailsResponse (status, players, amount, winner)

GET    /game/{betId}/history
  Output: Array of { round: int, p1Outcome: int, p2Outcome: int, winner: address }

GET    /proof/{betId}/{round}
  Output: { betId, round, drandRound, drandValue, txHash, outcomes, winner }
  Shareable proof object (see 5.4 below)
```

#### 5.3.3: Atomicity Benefits

| Current | Problem | Atomic Solution |
|---------|---------|-----------------|
| `/bet/place` | Can't verify intermediate state | `/bet/create` + check contract |
| `/game/play` | 3 operations bundled | `/game/round`, `/game/settle`, `/game/claim` |
| No verify | Can't prove outcome independently | `/outcome/verify` + `/random/derive` |

**Deliverable:** [ATOMIC_API_SPEC.md](ATOMIC_API_SPEC.md) - Full API with all atomic operations

---

### PHASE 5.4: Public Outcome Verification System (Day 2-3)
**Goal:** Create shareable, verifiable proof of any game outcome

#### 5.4.1: Proof Object Structure

```json
{
  "gameId": "0xabc123",
  "betId": "123",
  "players": ["0xPlayer1...", "0xPlayer2..."],
  "betAmount": "10",
  "gameType": "dice_best_of_5",
  
  "rounds": [
    {
      "roundNum": 1,
      "drandRound": 8739,
      "drandValue": "0x123abc456def789...",
      "player1Outcome": 7,
      "player2Outcome": 9,
      "roundWinner": "0xPlayer2...",
      "contractTxHash": "0x...",
      "timestamp": "2024-02-22T10:30:00Z"
    },
    {
      "roundNum": 2,
      "drandRound": 8740,
      "drandValue": "0x456def789abc123...",
      "player1Outcome": 6,
      "player2Outcome": 5,
      "roundWinner": "0xPlayer1...",
      "contractTxHash": "0x...",
      "timestamp": "2024-02-22T10:31:00Z"
    }
  ],
  
  "finalResult": {
    "winner": "0xPlayer2...",
    "winnings": "19.6",
    "fee": "0.4",
    "claimTxHash": "0x...",
    "claimedAt": "2024-02-22T10:35:00Z"
  },
  
  "verificationLinks": [
    "https://drandbeacon.io/round/8739",
    "https://drandbeacon.io/round/8740",
    "https://polygonscan.com/tx/0x..." (settlement),
    "https://polygonscan.com/tx/0x..." (claim)
  ],
  
  "verificationFormula": {
    "derivation": "(drandValue % 12) + 1",
    "scalable": true,
    "parameters": { "min": 1, "max": 12 }
  }
}
```

#### 5.4.2: Verification Endpoints

```
GET /proof/{betId}
  Returns: Complete proof object (JSON)
  Use: Share/publish/verify game outcome

GET /proof/{betId}/shareable
  Returns: Compressed proof with verification links
  Use: Tweet, embed in website, social media

GET /proof/{betId}/verify
  Input: { roundNum: int, claimedOutcome: int, drandValue: string }
  Output: { valid: bool, derivedOutcome: int, matchesChain: bool }
  Use: Third-party verification

POST /proof/publish
  Input: { proofObject }
  Output: { published: bool, ipfsHash: string, url: string }
  Use: Store on IPFS, get permanent link
```

#### 5.4.3: Example Shareable Proof URL

```
bitcino.io/proof/bet_123?verify=true

Expands to:
{
  "betId": "bet_123",
  "result": "Player2 won 19.6 MATIC",
  "gameLink": "https://drandbeacon.io/round/8739",
  "contractProof": "https://polygonscan.com/tx/0x...",
  "mathProof": "https://bitcino.io/api/proof/bet_123",
  "anyoneCanVerify": true
}
```

**Deliverable:** [PUBLIC_PROOF_FORMAT.md](PUBLIC_PROOF_FORMAT.md) - Proof specification + examples

---

### PHASE 5.5: Execute Live Game (Day 3)
**Goal:** Run 1 complete game on mainnet with validation

#### 5.5.1: Pre-Game Checklist

```bash
# Environment
✓ Mainnet contract verified (Polygonscan)
✓ Server connected to mainnet RPC
✓ Frontend pointing to mainnet server
✓ Two test wallets funded with gas + bet amount

# Contract State
✓ Fee receiver set correctly
✓ Server wallet authorized
✓ No existing bets (clean state)
✓ All events readable
```

#### 5.5.2: Game Execution Steps

```
1. SETUP PHASE
   - Player1: Click "Create Game" with 10 MATIC
   - Verify: Contract received funds (check state)
   - Verify: Bet created with correct ID
   
2. JOIN PHASE
   - Player2: Scan link, join game
   - Verify: Contract locked Player2 funds
   - Verify: Both players in "Active" status
   
3. PLAY PHASE (Best of 3)
   Round 1:
   - Both click "Roll"
   - Fetch Drand round (note the round number)
   - Verify outcomes calculated correctly
   - Verify on-chain settlement succeeded
   
   Round 2:
   - Repeat
   
   Round 3:
   - Game ends (first to 2 wins)
   
4. CLAIM PHASE
   - Winner claims winnings
   - Verify: Funds in wallet (balance check)
   - Verify: On-chain event recorded
```

#### 5.5.3: Validation Checklist

After game completes:

```
CONTRACT STATE
✓ Bet status = "Settled"
✓ Winner correctly recorded
✓ Funds transferred to contract
✓ All events emitted correctly
✓ Events queryable on Polygonscan

DRAND VERIFICATION
✓ Each round has Drand proof
✓ Visit drandbeacon.io for each round
✓ Verify our formula matches
✓ No manipulation possible

TRANSACTION INTEGRITY
✓ Each settlement has txHash
✓ View on Polygonscan
✓ Sender is server wallet
✓ No reverted transactions

API CONSISTENCY
✓ GET /bet/{id} matches chain state
✓ GET /proof/{id} contains all data
✓ /outcome/verify confirms outcomes
```

**Deliverable:** [MAINNET_GAME_LOG.md](MAINNET_GAME_LOG.md) - Full game execution + validation results

---

## Missing Pieces to Fill

### 1. Contract Validation Interface

Create endpoint to read contract state directly:

```
GET /contract/state/{betId}
  Input: betId
  Output: 
    {
      "betId": "123",
      "player1": "0x...",
      "player2": "0x...",
      "amount": "10.0",
      "status": "Settled",
      "winner": "0x...",
      "settledAt": "1708595400",
      "txHash": "0x...",
      "blockNumber": 19284920,
      "gasUsed": "82000"
    }
```

### 2. Drand History Integration

Add Drand caching to avoid rate limits:

```
GET /drand/rounds?from=8700&to=8800
  Returns: Array of all Drand rounds in range
  Use: Verify historical games

GET /drand/{roundNum}
  Returns: Cached Drand data + our outcome derivation
```

### 3. Outcome Reproducibility Test

Create endpoint that proves outcome from scratch:

```
POST /verify/reproduce
  Input: { betId, round: int, drandRound: int, drandValue: string }
  Output: 
    {
      "betId": "123",
      "round": 1,
      "drandSource": "drandbeacon.io API",
      "drandRound": 8739,
      "drandValue": "0x...",
      "calculation": {
        "step1": "parseInt('0x...', 16) = 123456789",
        "step2": "123456789 % 12 = 9",
        "step3": "9 + 1 = 10",
        "result": 10
      },
      "contractRecordedOutcome": 10,
      "matchesChain": true,
      "humanReadable": "Rolled a 10 (four + six)"
    }
```

### 4. Gas Metrics & Cost Analysis

Add to each API response:

```
{
  ...response,
  "gasMetrics": {
    "estimatedGasForSettlement": "82000",
    "estimatedGasPrice": "50 gwei",
    "estimatedCostUSD": "$0.45",
    "actualGasUsed": "79482",
    "actualCostUSD": "$0.44"
  }
}
```

### 5. Public API Documentation

Create shareable API docs:

```
/docs/public
/docs/public/quick-start
/docs/public/verify-outcome
/docs/public/randomness-formula
/docs/public/audit-trail
```

---

## Testing Order (Sequential Dependency)

```
Day 1:
  ✓ 5.1 - Mainnet config validation
  ✓ 5.2 - Randomness scalability math
  ✓ 5.3 - Atomic API design

Day 2:
  ✓ 5.4 - Public proof format spec
  ✓ Implement atomic API endpoints ← Start here
  ✓ Implement proof endpoints

Day 3:
  ✓ 5.5 - Execute live game
  ✓ Validate on-chain
  ✓ Test all verification flows

Day 4:
  ✓ Complete missing pieces (#1-5)
  ✓ Document public API
  ✓ Deploy updated API
  
Day 5:
  ✓ Run 3 more games (different scenarios)
  ✓ Test error paths
  ✓ Verify scalability claims
```

---

## Success Criteria

### Game Execution
- [ ] 1 complete game played on mainnet
- [ ] Both players funded, bet placed, all rounds completed
- [ ] Winner correctly determined
- [ ] Winnings claimed and received

### On-Chain Validation
- [ ] Contract state matches API responses
- [ ] All events emitted and logged
- [ ] All transactions viewable on Polygonscan
- [ ] Zero failed transactions

### Randomness Verification
- [ ] Drand values fetched for each round
- [ ] Outcomes reproducible from published Drand
- [ ] Formula verified against chain outcomes
- [ ] Anyone can independently verify

### Public API
- [ ] All atomic endpoints working
- [ ] Shareable proof objects generated
- [ ] Third-party can verify outcome
- [ ] No trust in server required

### Scalability Claims
- [ ] Formula works for any range [min, max]
- [ ] Multi-seed derivation produces independent outcomes
- [ ] Gas costs documented
- [ ] Verified on mainnet

---

## Next Steps

1. **Review** this document
2. **Agree** on implementation order
3. **Create** each markdown file (ATOMC_API_SPEC.md, RANDOMNESS_SCALABILITY.md, etc)
4. **Implement** atomic API endpoints
5. **Execute** live game with validation

Ready to start implementation?
