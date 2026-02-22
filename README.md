# Buster Protocol

A **trustless, verifiable gaming protocol** using Drand public randomness.

## Overview

Buster enables fair, transparent games where:
- **No server** can manipulate outcomes
- **Anyone** can verify results
- Randomness comes from **League of Entropy** (Drand)
- Outcomes are **deterministic & auditable**

## Quick Start

### 1. Play the Interactive Demo

```bash
cd demo
python game.py
```

Pick a number 1-6 and let the Drand randomness determine if you win!

### 2. See Auto-Verification in Action

```bash
python demo_auto_verify.py
```

Shows the complete protocol flow with automatic verification.

### 3. Understand the Protocol

Read the documentation:
- [Buster Demo Guide](demo/README.md) - Interactive game walkthrough
- [Project Status](docs/PROJECT_STATUS.md) - Current phase and progress
- [Phase 4: Drand Integration](docs/PHASE_4_DRAND_COMPLETE.md) - Technical details

## Setup

1. **Configure environment:**
   ```powershell
   copy .env.template .env
   # Edit .env with your RPC URLs and keys
   # (never commit the real .env file)
   ```

2. **Install contract dependencies:**
   ```bash
   cd contract
   npm install
   ```

3. **Run tests:**
   ```bash
   npm test
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

## Project Structure

```
bitcino/
├── contract/          # Solidity smart contracts (Polygon)
│   ├── contracts/     # DrandGame.sol, SeedCommit.sol
│   ├── test/          # Hardhat tests (17 passing)
│   └── scripts/       # Deployment & demo scripts
├── demo/              # Interactive Python demo
│   ├── game.py        # Main interactive game
│   ├── verify.py      # Verification system
│   ├── analyze_fairness.py  # Prove uniform distribution
│   └── *.md           # Complete documentation
├── docs/              # Technical documentation
│   ├── PROJECT_STATUS.md    # Current status
│   ├── PHASE_4_DRAND_COMPLETE.md  # Phase 4 details
│   └── CONTRACT_ADDRESS.md  # Deployed contracts
├── protocol/          # Core seed generation library
│   └── seed.py        # Pure Python, no dependencies
└── legacy/            # Previous implementation (archived)
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

## Demo Scripts

| Script | Purpose | Run |
|--------|---------|-----|
| `game.py` | Interactive guessing game | `python game.py` |
| `demo_auto_verify.py` | Shows verification (no input) | `python demo_auto_verify.py` |
| `test_game.py` | Automated tests | `python test_game.py` |
| `demo_real_drand.py` | Real Drand demonstrations | `python demo_real_drand.py` |
| `verify.py` | Verification tool | `python verify.py` |
| `analyze_fairness.py` | Prove uniform distribution | `python analyze_fairness.py` |

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
A: Only gas fees. On Polygon, very cheap (cents, not dollars).

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
