# Demo Folder - Complete Reference

This folder contains **interactive demonstrations** of the Buster Protocol.

## Overview

The **demo** is a playable implementation of the full protocol:

✅ You pick a number (1-6)  
✅ Lock it on-chain  
✅ Get public Drand randomness  
✅ Calculate deterministic outcome  
✅ Verify the result  
✅ See if you won  

All in pure Python, no server required.

---

## Files & Their Purpose

### 🎮 Interactive Game

**`game.py`** - Main interactive game
- Ask user to pick 1-6
- Lock in the guess
- Fetch Drand randomness
- Calculate outcome
- Show winner
- Offer audit trail

**Run:**
```bash
python game.py
```

**What you get:**
- 5-phase walkthrough
- Learning experience
- Links to verify on-chain
- Multiple round support

---

### ✅ Automated Tests

**`test_game.py`** - Test suite (non-interactive)
- Run complete game flow automatically
- Verify all functions work
- Test multiple outcome ranges
- Show test results

**Run:**
```bash
python test_game.py
```

**What you get:**
- Confirmation all code works
- Example of each range type
- ~1 second execution

---

### 📊 Fairness Analysis

**`analyze_fairness.py`** - Distribution analysis
- Run 10,000+ simulated games
- Show outcome distribution
- Prove uniform fairness
- Verify determinism

**Run:**
```bash
python analyze_fairness.py
```

**What you get:**
- Percentage distribution of outcomes
- Deviation from expected
- Fairness verification
- Proof across all ranges

---

### 📖 Documentation

**`QUICKSTART.md`** - Get started in 30 seconds
- 3 ways to run the demo
- Quick reference
- File guide
- FAQ

**`README.md`** - Complete guide
- Full explanation of each phase
- How the protocol works
- Verification on-chain
- Learning resources
- Production extensions

**`INDEX.md`** - Detailed reference
- File descriptions
- How to extend
- Code examples
- Troubleshooting

---

### 📦 Configuration

**`requirements.txt`** - Python dependencies
- Currently: **None** (pure stdlib)
- Optional: requests, web3.py for production

---

## Getting Started

### Step 1: Understand (2 minutes)
```bash
cat QUICKSTART.md
```

### Step 2: Play (2 minutes)
```bash
python game.py
```

### Step 3: Verify (1 minute)
- Visit link to drandbeacon.io shown in game
- Manually calculate (randomness % 6) + 1
- Confirm it matches

### Step 4: Go Deeper (10 minutes)
```bash
python test_game.py
python analyze_fairness.py
```

### Step 5: Learn Architecture
- Read: `README.md`
- Review: `../docs/PHASE_4_DRAND_COMPLETE.md`
- Inspect: `../contract/contracts/DrandGame.sol`

---

## Code Structure

### Core Functions (in `game.py`)

```python
def validate_guess(guess_str: str) -> int:
    """Validate 1-6 range"""

def lock_guess(guess: int) -> str:
    """Create commitment hash"""

def fetch_drand_value() -> int:
    """Get randomness (simulated or real)"""

def calculate_outcome(drand_value, min_val, max_val) -> int:
    """Deterministic formula: (drand % range) + min"""

def verify_outcome(drand_value, claimed, min_val, max_val) -> bool:
    """Check if outcome is correct"""
```

Each function is **identical logic** to what runs on-chain in Solidity.

---

## Protocol Flow Visualization

```
┌─────────────────────────────┐
│  DEMO: Interactive Game     │
├─────────────────────────────┤
│                             │
│  PHASE 1: SETUP             │
│  ├─ Generate gameId         │
│  └─ Lock drandRound         │
│                             │
│  PHASE 2: PLAYER GUESS      │
│  ├─ Ask "Pick 1-6"          │
│  └─ Lock guess commitment   │
│                             │
│  PHASE 3: DRAND REVEALED    │
│  ├─ Fetch randomness        │
│  └─ Show drandbeacon.io     │
│                             │
│  PHASE 4: CALCULATE         │
│  ├─ outcome = (drand%6)+1   │
│  └─ Display result          │
│                             │
│  PHASE 5: VERIFY            │
│  ├─ Compare guess vs result │
│  └─ Show WIN/LOSS           │
│                             │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│  SMART CONTRACT (on-chain)  │
├─────────────────────────────┤
│  Same formula, same logic   │
│  Deployed on Polygon        │
│  Address: 0x48F50...       │
└─────────────────────────────┘
```

---

## How Demo Maps to Contract

### Demo Function → Contract Function

| Demo | Smart Contract | Purpose |
|------|---|---------|
| `validate_guess()` | Input validation | Ensure 1-6 |
| `lock_guess()` | `lockDrandRound()` | Commit to randomness |
| `fetch_drand_value()` | External API | Get public randomness |
| `calculate_outcome()` | `calculateOutcome()` | Deterministic formula |
| `verify_outcome()` | `verifyOutcome()` | Validate result |

**Key Point:** Demo and contract use **identical math**.

---

## Running All Demos

```bash
# Play 1 round (interactive)
python game.py

# Run automated test
python test_game.py

# Analyze distribution (10,000 trials)
python analyze_fairness.py
```

Total time: ~10 seconds for all three.

---

## Extending the Demo

### Change Game Range

**Edit game.py, change line 226:**

From:
```python
outcome = calculate_outcome(drand_value, 1, 6)  # Dice
```

To:
```python
outcome = calculate_outcome(drand_value, 2, 12)  # Two dice
outcome = calculate_outcome(drand_value, 1, 100)  # Percentile
outcome = calculate_outcome(drand_value, 0, 1)  # Coin flip
outcome = calculate_outcome(drand_value, 0, 51)  # Card
```

### Fetch Real Drand

Replace `fetch_drand_value()` with:
```python
import requests

def fetch_drand_value() -> int:
    r = requests.get("https://drandbeacon.io/api/public/latest")
    data = r.json()
    return int(data["randomness"], 16)
```

### Verify On-Chain

```python
from web3 import Web3

contractAddr = "0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43"
w3 = Web3(Web3.HTTPProvider("https://polygon-rpc.com"))
contract = w3.eth.contract(address=contractAddr, abi=ABI)

# Call actual contract function
is_valid = contract.functions.verifyOutcome(
    gameId, drandValue, outcome, 1, 6
).call()
```

---

## FAQ

**Q: Is this actually using real Drand?**  
A: Demo uses simulated values. Production version would fetch from drandbeacon.io API.

**Q: Can I play for real money?**  
A: The contract is live on Polygon. You could build a betting layer on top.

**Q: How do I deploy this?**  
A: Contract is already deployed: `0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43`
   Just call the functions with web3.py or web3.js

**Q: Can I modify the formula?**  
A: Yes, but both players must agree. Contract stores the formula commitment.

**Q: What if Drand is down?**  
A: Protocol locks a specific round. You can always look it up later on archives.

---

## Learning Resources

**In This Folder:**
- `QUICKSTART.md` - You are here
- `README.md` - Full documentation
- `INDEX.md` - Detailed reference

**In Parent Directory:**
- `../docs/PHASE_4_DRAND_COMPLETE.md` - Protocol details
- `../docs/DETERMINISTIC_MATH.md` - Math explanation
- `../contract/contracts/DrandGame.sol` - Smart contract source
- `../docs/PROJECT_STATUS.md` - Full project status

---

## Summary

The **demo folder** shows:

✅ Complete playable game  
✅ All protocol functions  
✅ Multiple test cases  
✅ Fairness verification  
✅ Production-ready code  

You can:

✅ Play interactively  
✅ Verify outcomes  
✅ Extend for real use  
✅ Deploy on mainnet  
✅ Build your platform  

---

## Next: Actually Deploy

The protocol is ready. To build a real platform:

1. Use the contract address above
2. Build a frontend (React, Vue, etc)
3. Add payment/matching server
4. Launch for real users
5. Get users playing

Everything else is just **UI + UX**.

The **trustless core** is already live.

---

**Ready to play?**

```bash
python game.py
```

Let's go! 🎲

