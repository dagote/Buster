# Buster Protocol

A **trustless, open-source protocol framework** for transparent games using Drand public randomness.

## What is This?

Buster is a **protocol layer** that anyone can build on:

- **No vendor lock-in** - Deploy your own contracts and server
- **Verifiable outcomes** - Players can prove fairness independently  
- **Open & forkable** - Modify the contracts for your game
- **Protocol-first** - Contract is the source of truth, not a service

**You** provide the game operator wallet and collect the fees. The protocol just ensures it's fair.

## Quick Start

### 1. Play the Interactive Demo (30 seconds)

```bash
cd demo
python game.py
```

Pick a number 1-6 and let the Drand randomness determine if you win!

### 2. See Full Quickstart

**New to Buster?** Read [docs/QUICKSTART.md](docs/QUICKSTART.md) for detailed setup.

**API Reference?** Check [docs/API_FUNCTIONS.md](docs/API_FUNCTIONS.md) for all functions.

### 3. Learn More

- [Project Status](docs/PROJECT_STATUS.md) - Current phase and progress
- [Drand Integration](docs/PHASE_4_DRAND_COMPLETE.md) - Technical deep dive
- [How the Math Works](docs/DETERMINISTIC_MATH.md) - Understand fairness

## Setup

1. **Clone and configure:**
   ```bash
   git clone <repo-url>
   cd buster
   copy .env.template .env
   ```

2. **Install dependencies** (contract only; demo uses stdlib):
   ```bash
   cd contract && npm install
   ```

3. **Run tests:**
   ```bash
   cd contract && npm test    # Smart contracts (17 tests)
   cd ../demo && python test_game.py  # Demo (3 test suites)
   ```

## Current Status (Phase 4)

✅ **Smart Contracts**
- SeedCommit: `0x0f4e83625223833460cF1f0f87fc4584CE5fECBa` (Polygon mainnet)
- DrandGame: `0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43` (Polygon mainnet)
- 17 tests passing (14 DrandGame + 3 SeedCommit)

✅ **Interactive Demo**
- 4 playable game scripts (game.py, test_game.py, demo_real_drand.py, demo_auto_verify.py)
- Auto-verification system (verify.py)
- Fairness analysis (analyze_fairness.py)
- Zero external dependencies (Python stdlib only)

✅ **Randomness**
- Official Drand beacon (League of Entropy)
- Real round 17598 data integrated
- Verifiable at https://drand.love/

```

## How It Works

### 1. Game Setup
- Player locks in a number (1-6)
- Game parameters immutable on-chain

### 2. Randomness Source
- Drand beacon provides public randomness
- Round number known in advance
- Value revealed deterministically

### 3. Outcome Calculation
- Deterministic formula: `outcome = (drand_value % range) + min`
- Same in Python demo AND Solidity contract
- Identical results guaranteed

### 4. Verification
- Everyone can verify the outcome
- Check: Visit https://drand.love/ for round data
- Recalculate: Apply the formula
- Confirm: Results match

## Smart Contracts

### DrandGame.sol
Core protocol contract using Drand randomness.

**Deployed on Polygon:**
```
0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43
```

**Verify on PolygonScan:**
https://polygonscan.com/address/0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43

### SeedCommit.sol
Phase 3 contract - anchors game parameters on-chain.

**Deployed on Polygon:**
```
0x0f4e83625223833460cF1f0f87fc4584CE5fECBa
```

## Verification

All outcomes are independently verifiable:

1. **Official Drand**: https://drand.love/
2. **Manual verification**:
   ```python
   from demo.verify import DrandVerifier
   verifier = DrandVerifier()
   result = verifier.verify_game(17598, 2, 1, 6)
   print(result)  # {'valid': True, ...}
   ```
3. **On-chain**: View contract on PolygonScan

## Development

### Contract Development
```bash
cd contract
npm install
npm test
npx hardhat run scripts/deploy.js --network polygon
```

### Demo Testing
```bash
cd demo
python -m py_compile *.py    # Syntax check
python test_game.py           # Run tests
python analyze_fairness.py    # Prove fairness
```

## Randomness Source

**League of Entropy (Drand)**
- Public, decentralized randomness beacon
- No single entity controls outcomes
- Threshold cryptography protects against manipulation
- New round every ~3 seconds on mainchain
- Verifiable by anyone

**Access:**
- API: https://api.drand.sh/public/{round_number}
- Explorer: https://drand.love/
- Docs: https://docs.drand.love/

## Testing

### Smart Contract Tests
```bash
cd contract
npm test
# Output: 17 passing (2.5s)
```

### Python Demo Tests
```bash
cd demo
python test_game.py           # Game logic
python test_real_drand.py     # Drand integration
python test_auto_verify.py    # Verification
```

### Fairness Analysis
```bash
cd demo
python analyze_fairness.py
# 10,000+ trials proving uniform distribution
```

## FAQ

**Q: Is this actually fair?**
A: Yes. Run `analyze_fairness.py` to see 10,000+ trials showing uniform distribution.

**Q: Can someone cheat?**
A: No. Outcomes depend on Drand (threshold cryptography) and are immutable on-chain.

**Q: How much does it cost to play?**
A: Only gas fees on Polygon. You'll need a wallet with a small amount of POL (~$0.01-0.10 per transaction). Very cheap, but you need to fund your own wallet.

**Q: Can I use this in production?**
A: The contracts are auditable, tested, and live. You can deploy and use them.

**Q: What if Drand is unavailable?**
A: The protocol locks a specific round, so you can always look it up later.

## License

MIT - Open source for research, education, and production use.

## Contact

For questions, open an issue on this repository.

---

**Ready to play?**

```bash
cd demo && python game.py
```

May the Drand odds be ever in your favor! 🎲
