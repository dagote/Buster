# Buster Protocol Demo Index

Welcome to the interactive **Buster Protocol demo**! Here's everything you need to know.

## Quick Start

```bash
cd demo
python game.py
```

Pick a number 1-6, lock it in, and see if you win based on Drand randomness!

---

## Files in This Directory

### 📘 README.md
Complete guide to the demo including:
- How to run the game
- Explanation of each game phase
- How the protocol works
- Verification on drandbeacon.io and PolygonScan
- FAQ and learning resources

**Start here if you're new.**

### 🎮 game.py
The **main interactive game script**.

**What it does:**
1. Asks you to pick a number (1-6)
2. Locks in your guess
3. Generates a Drand-like randomness value
4. Calculates outcome using the smart contract formula
5. Determines if you won or lost
6. Shows how to verify the result on-chain

**Run it:**
```bash
python game.py
```

**Features:**
- ✅ Complete game flow (5 phases)
- ✅ Uses exact formula from DrandGame.sol
- ✅ Shows public audit trail
- ✅ Play multiple rounds
- ✅ Pure Python (no dependencies)

### ✅ test_game.py
**Automated test script** (no user interaction needed).

Verifies:
- Guess validation
- Commitment logic
- Outcome calculation for various ranges
- Verification function
- Multiple test cases

**Run it:**
```bash
python test_game.py
```

**Output:**
Shows a complete game flow automatically and confirms all logic works correctly.

### � verify.py
**Local Drand verification system** - Auto-verify outcomes without relying on websites.

**What it does:**
- Stores known Drand rounds (round 17598 included)
- Allows you to verify any game outcome
- Calculate game results from Drand values
- Works completely offline (no API needed)

**Features:**
- DrandVerifier class for programmatic use
- Interactive mode for manual verification
- Display detailed round information
- List stored rounds

**Use it:**
```python
from verify import DrandVerifier
verifier = DrandVerifier()
result = verifier.verify_game(17598, 2, 1, 6)
print(result)  # {'valid': True, 'actual_outcome': 2, ...}
```

**Or interactively:**
```bash
python verify.py
```

Then select option 1 to verify a game outcome.

### ✅ test_verify.py
**Test suite for the verification system**.

Tests:
- Display round information
- Verify correct outcomes
- Reject incorrect outcomes
- Lookup stored rounds
- Add new rounds to database

**Run it:**
```bash
python test_verify.py
```

### 🎲 demo_real_drand.py
**Complete game demonstrations using REAL Drand data**.

Shows:
- 3 complete 5-phase games using authentic League of Entropy randomness
- Winning and losing scenarios
- Summary statistics
- The protocol in action with real data

**Run it:**
```bash
python demo_real_drand.py
```

**Output:**
Two winning and two losing games with real Drand round 17598.

### ✅ test_real_drand.py
**Test suite for real Drand verification**.

Validates:
- Correct guesses pass verification
- Incorrect guesses fail verification
- Multiple outcome ranges work correctly
- Round lookup succeeds
- Display functionality

**Run it:**
```bash
python test_real_drand.py
```

### 🔍 demo_auto_verify.py
**Demonstration of auto-verification in the game** - NEW!

Shows:
- Complete game flow with 5 phases
- Automatic verification of outcomes
- Real Drand data from round 17598
- Public audit trail
- How anyone can verify the result

**Run it:**
```bash
python demo_auto_verify.py
```

**Output:**
Shows a complete game with automatic verification (no user input).

### ✅ test_auto_verify.py
**Test the auto-verification system** - NEW!

Validates:
- game.py imports DrandVerifier correctly
- fetch_drand_value works with real Drand
- calculate_outcome produces correct results
- verify_game returns valid results

**Run it:**
```bash
python test_auto_verify.py
```

### �📦 requirements.txt
Lists Python dependencies (currently none - stdlib only).

Optional future deps for production:
- `requests` - Fetch real Drand from API
- `web3.py` - On-chain verification

---

## Demo Walkthrough

### Phase 1: Setup
```
Game ID created: abc123def456...
Drand round locked: 8739
```
Your game parameters are immutable.

### Phase 2: Player Guess
```
Your guess: 4
Commitment: 4b227777d4dd1fc61c6f...
```
Your guess is locked (commitment-based).

### Phase 3: Drand Revealed
```
Drand Round: 8739
Randomness: 0x3ade68b1
Link: https://drandbeacon.io/round/8739
```
The randomness comes from a public, auditable source.

### Phase 4: Outcome Calculated
```
Formula: outcome = (drandValue % 6) + 1
(987654321 % 6) + 1 = 4
```
The outcome is calculated deterministically.

### Phase 5: Verification & Result
```
Your guess:    4
Outcome:       4
Result:        WIN ✅
```

Anyone can verify:
1. Visit drandbeacon.io/round/8739
2. Get randomness value
3. Calculate (value % 6) + 1
4. Confirm it matches

---

## How It Matches the Smart Contract

### Python Formula (game.py)
```python
def calculate_outcome(drand_value: int, min_val: int = 1, max_val: int = 6) -> int:
    range_size = max_val - min_val + 1
    outcome = (drand_value % range_size) + min_val
    return outcome
```

### Solidity Formula (contract/contracts/DrandGame.sol)
```solidity
function calculateOutcome(
    uint256 drandValue,
    uint256 min,
    uint256 max
) external pure returns (uint256) {
    uint256 range = max - min + 1;
    uint256 outcome = (drandValue % range) + min;
    return outcome;
}
```

**Both produce identical results.** This is the essence of trustless gaming.

---

## Running the Tests

### Unit Test (Automated)
```bash
python test_game.py
```
Shows all game logic works correctly without user input.

### Interactive Game
```bash
python game.py
```
Play actual rounds with realtime feedback.

### Smart Contract Tests
```bash
cd ../contract
npm test
```
Runs all 17 contract tests (locally and on mainnet).

---

## Extending the Demo

### Change the Game Range

**Two dice (2-12):**
```python
outcome = calculate_outcome(drand_value, 2, 12)
```

**Coin flip (0-1):**
```python
outcome = calculate_outcome(drand_value, 0, 1)
```

**Percentile (1-100):**
```python
outcome = calculate_outcome(drand_value, 1, 100)
```

**Card deck (0-51):**
```python
outcome = calculate_outcome(drand_value, 0, 51)
```

The formula works for **ANY outcome range**.

### Fetch Real Drand (Production)

Replace this:
```python
def fetch_drand_value() -> int:
    # Simulated
    return secrets.randbits(256)
```

With this:
```python
import requests

def fetch_drand_value() -> int:
    response = requests.get("https://drandbeacon.io/api/public/latest")
    round_data = response.json()
    drand_hex = round_data["randomness"]
    return int(drand_hex, 16)
```

### Connect to Smart Contract

```python
from web3 import Web3

def verify_on_chain(game_id, drand_value, claimed_outcome):
    w3 = Web3(Web3.HTTPProvider("https://polygon-rpc.com"))
    contract = w3.eth.contract(
        address="0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43",
        abi=DRANDGAME_ABI
    )
    return contract.functions.verifyOutcome(
        game_id, drand_value, claimed_outcome, 1, 6
    ).call()
```

---

## Learning Path

1. **Start:** `python game.py` (play a round)
2. **Understand:** Read `README.md` (how it works)
3. **Test:** `python test_game.py` (verify logic)
4. **Verify:** Check result on drandbeacon.io
5. **Deploy:** Use the contract address in your own app
6. **Build:** Extend with web3.py for chain interaction

---

## Connected Documentation

- **Protocol Details:** `../docs/PHASE_4_DRAND_COMPLETE.md`
- **Smart Contract:** `../contract/contracts/DrandGame.sol`
- **Security Model:** How randomness prevents cheating
- **Project Status:** `../docs/PROJECT_STATUS.md`

---

## About This Demo

- ✅ **Fully Functional** - Play real rounds, see real outcomes
- ✅ **Educational** - Shows complete protocol flow
- ✅ **Reproducible** - Same formula as smart contract
- ✅ **Verifiable** - Links to public randomness sources
- ✅ **Open Source** - MIT license, extend freely
- ✅ **No Dependencies** - Pure Python stdlib

---

## Troubleshooting

**Q: `python: command not found`**  
A: Use `python3` or install Python from python.org

**Q: Game won't start**  
A: Check you're in the `demo/` directory: `cd demo`

**Q: Want to verify a real outcome?**  
A: Use the DrandGame contract address and check PolygonScan

**Q: How do I integrate this into my game?**  
A: Copy the `calculate_outcome()` and `verify_outcome()` functions

---

**Ready to play?**

```bash
python game.py
```

Good luck! 🎲
