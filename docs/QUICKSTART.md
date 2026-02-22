# Quick Start - 30 Seconds

## Play the Game

```bash
cd demo
python game.py
```

Pick a number 1-6. Drand randomness determines if you win! 🎲

---

## What Happens

1. **You pick** 1-6
2. **Drand randomness** reveals  
3. **Formula calculates** outcome
4. **You win or lose** (provably fair)
5. **Anyone can verify** the result

---

## Run Tests

```bash
python test_game.py           # Test all logic
python test_real_drand.py     # Verify with real Drand
python analyze_fairness.py    # Prove fairness (10k+ trials)
```

---

## Learn More

- **How it works?** → [docs/PHASE_4_DRAND_COMPLETE.md](PHASE_4_DRAND_COMPLETE.md)
- **API Reference?** → [docs/API_FUNCTIONS.md](API_FUNCTIONS.md)
- **View contracts?** → [docs/CONTRACT_ADDRESS.md](CONTRACT_ADDRESS.md)
- **Status?** → [docs/PROJECT_STATUS.md](PROJECT_STATUS.md)

---

## Next: Setup

If you want to deploy or interact with the contract:

```bash
# 1. Configure environment
copy .env.template .env

# 2. Edit .env
# WALLET_ADDRESS=0x...
# POLYGON_RPC_URL=https://polygon-rpc.com/

# 3. Run smart contract tests
cd contract && npm install && npm test
```

---

Done! You're now running Buster Protocol. 🎉


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
