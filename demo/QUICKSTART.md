# Bitcino Protocol Demo - Quick Start

**Get started in 30 seconds:**

```bash
cd demo
python game.py
```

Pick a number 1-6 and play! 🎲

---

## What You'll Experience

1. **Pick a number** (1-6)
2. **Lock in your guess** (commitment)
3. **Reveal Drand randomness** (public, verifiable)
4. **Calculate outcome** (deterministic formula)
5. **Win or lose** (based on pure math)

That's the entire Bitcino Protocol in one interactive game.

**New:** Outcomes are automatically verified using real Drand data!

---

## Three Ways to Run

### 1. Play Interactive Game
```bash
python game.py
```
- Interactive gameplay
- Full 5-phase walkthrough
- Audit trail provided
- Play multiple rounds

### 2. Run Automated Test
```bash
python test_game.py
```
- Automatic game flow (no input needed)
- Verify all logic works
- Shows outcomes for various ranges
- Takes ~1 second

### 3. See Auto-Verification Demo
```bash
python demo_auto_verify.py
```
- Shows auto-verification in action
- Complete 5-phase game flow
- Verification against real Drand
- No user input required
- Takes ~1 second

### 4. Analyze Fairness
```bash
python analyze_fairness.py
```
- Run 10,000+ simulations
- Show outcome distribution
- Prove uniform fairness
- Verify determinism
- Takes ~5 seconds

---

## Next Steps

1. **Understand the Protocol**
   - Read: `README.md`
   - Deep dive: `../docs/PHASE_4_DRAND_COMPLETE.md`

2. **Try Different Ranges**
   - Edit `game.py` line 226: change `1, 6` to any range
   - Two dice: `2, 12`
   - Percentiles: `1, 100`
   - Coin flip: `0, 1`

3. **Verify Drand Randomness**
   - Official site: https://drand.love/
   - API reference: https://docs.drand.love/developer/http-api/
   - Fetch round data: https://api.drand.sh/public/{round_number}
   - See how randomness becomes game outcome

4. **Connect to Smart Contract**
   - Contract address: `0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43`
   - Verify on: https://polygonscan.com/address/0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43
   - Learn web3 integration in `../docs/`

5. **Deploy Your Own**
   - Copy contract address
   - Use in your app
   - Fork and modify
   - Build your platform

---

## File Guide

| File | Purpose | Run |
|------|---------|-----|
| `game.py` | Interactive guessing game | `python game.py` |
| `test_game.py` | Automated test suite | `python test_game.py` |
| `analyze_fairness.py` | Distribution analysis | `python analyze_fairness.py` |
| `README.md` | Complete documentation | (read) |
| `INDEX.md` | Detailed file reference | (read) |
| `requirements.txt` | Python dependencies | (view) |

---

## Requirements

- **Python 3.6+**
- **No external packages** (uses stdlib only)

Verify you have Python:
```bash
python --version
```

---

## How It Works (30-second summary)

```
Your Guess (1-6)
    ↓
[Locked on-chain]
    ↓
Drand Randomness (from public beacon)
    ↓
[Deterministic Formula: (drand % 6) + 1]
    ↓
Outcome (1-6)
    ↓
[Compare with your guess]
    ↓
WIN or LOSE
    ↓
[Auditable by anyone]
```

The secret: **No server decides the outcome. Math does.**

---

## Key Properties

✅ **Trustless** - No server can cheat  
✅ **Verifiable** - Anyone can check the math  
✅ **Scalable** - Works for any outcome range  
✅ **Fair** - Uniform distribution (proven)  
✅ **Deterministic** - Same input → same output  

---

## Questions?

**Q: Is this actually fair?**  
A: Yes. Run `python analyze_fairness.py` to see 10,000+ trials showing uniform distribution.

**Q: How does Drand prevent cheating?**  
A: Drand uses threshold cryptography. No single party can predict or suppress values.

**Q: Can I use this in a real game?**  
A: Yes! The smart contract is live on Polygon mainnet. Anyone can deploy and use it.

**Q: What if I want a different outcome range?**  
A: The formula scales. Change the range in `game.py` or the contract.

**Q: How do I verify on-chain?**  
A: Every outcome can be verified on PolygonScan using the DrandGame contract address.

---

## Ready?

```bash
python game.py
```

Good luck! 🎲

---

**Learn more:**
- Protocol: `../docs/PHASE_4_DRAND_COMPLETE.md`
- Contract: `../contract/contracts/DrandGame.sol`
- Status: `../docs/PROJECT_STATUS.md`
