# Buster Protocol Demo

An interactive demonstration of the **Buster Protocol** - a trustless game system using Drand verifiable randomness.

## What This Demo Shows

This is a **complete, playable game** that demonstrates:

1. ✅ **Player Commitment** - You lock in a guess (1-6)
2. ✅ **Public Randomness** - Fetches Drand beacon value
3. ✅ **Deterministic Outcome** - Calculates result using the exact formula in the smart contract
5. ✅ **Auto-Verification** - Outcomes verified automatically against Drand data
6. ✅ **Transparency** - Links to drand.love and PolygonScan for full audit trail

## How to Run

### Quick Start

```bash
cd demo
python3 game.py
```

### Requirements

- Python 3.6+ (no external dependencies needed)
- Standard library only: `hashlib`, `secrets`, `enum`

## Game Flow

### Phase 1: Setup
- Game ID created (would be immutable on-chain)
- Drand round locked (which randomness source to use)

### Phase 2: Player Guess
- You pick a number 1-6
- Your guess is locked (commitment created)

### Phase 3: Drand Revealed
- Drand randomness is fetched (or simulated for demo)
- Shows the exact value and round number

### Phase 4: Outcome Calculated
- Uses the formula: `outcome = (drandValue % 6) + 1`
- This is IDENTICAL to what the smart contract does
- Result is deterministic and verifiable

### Phase 5: Auto-Verification
- Outcome automatically verified against Drand value
- Verification uses the League of Entropy data
- Check if your guess matches the outcome
- **Winner determined!**

## The Protocol Formula

The same formula used in this demo **runs on the smart contract**:

```python
# Demo version (Python)
outcome = (drand_value % 6) + 1

# Contract version (Solidity)
uint256 outcome = (drandValue % (max - min + 1)) + min;
```

Both produce **identical results** for identical inputs.

## Verification (Automatic & Manual)

**Automatic Verification:**
Each game is automatically verified using stored Drand data.

**Manual Verification:**
You can also manually verify results on:

2. **Drand Beacon**: https://drand.love/
   - Official League of Entropy randomness beacon
   - API: https://api.drand.sh/public/{round_number}
   - Get randomness value
   - Manually calculate (value % 6) + 1
   - Confirm it matches

2. **Polygon Blockchain**: https://polygonscan.com/address/0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43
   - Smart contract is deployed and live
   - Any game can be verified on-chain
   - Transaction history is public

## Why This Matters

### Traditional Games
- Server picks the outcome
- You must trust the server
- No way to verify fairness

### Buster Protocol Games
- No server picks outcomes
- Outcome is mathematical (Drand value → formula)
- **Anyone can verify** independently
- Smart contract prevents cheating

## The Contracts

This demo demonstrates the **DrandGame contract**:

**Address:** `0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43`

**Three Core Functions:**

```solidity
// Lock to a Drand round
lockDrandRound(bytes32 gameId, uint256 drandRound)

// Calculate outcome deterministically
calculateOutcome(uint256 drandValue, uint256 min, uint256 max) → uint256

// Verify any outcome is correct
verifyOutcome(gameId, drandValue, claimedOutcome, min, max) → bool
```

All three are demonstrated in this interactive game.

## Scalability

The same protocol works for:

- **Dice** (1-6): This demo
- **Two Dice** (2-12): Change min=2, max=12
- **Cards** (0-51): Change min=0, max=51
- **Percentiles** (1-100): Change min=1, max=100
- **Coin Flip** (0-1): Change min=0, max=1
- **Any Range**: Just adjust min/max

Formula stays the same for all: `(drandValue % range) + min`

## Production Version

This demo uses **simulated Drand values**. A production version would:

1. Fetch real Drand from: `https://api.drand.sh/public/latest`
2. Submit to actual smart contract on Polygon
3. Store verified results on-chain
4. Link to official Drand beacon at https://drand.love/ for audit

The core logic (in `game.py`) is **identical** to what runs on-chain.

## Architecture

```
Player
   ↓
[Pick 1-6]
   ↓
[Lock guess (commitment)]
   ↓
[Fetch Drand randomness]
   ↓
[Calculate outcome: (drand % 6) + 1]
   ↓
[Compare with guess]
   ↓
[Winner determined]
   ↓
[Public audit trail created]
```

## Next Steps

### For Players
- Play multiple rounds
- Verify outcomes on https://drand.love/
- Deploy the contract yourself
- Use it in real games

### For Developers
- Modify min/max values to create different games
- Integrate with web3.py for real chain interaction
- Add betting logic on top
- Build a frontend UI

### For Auditors
- Review the Solidity code in `contract/contracts/DrandGame.sol`
- Run unit tests: `cd ../contract && npm test`
- Verify on PolygonScan
- Test the live demo: `npx hardhat run scripts/demo-drand.js --network polygon`

## FAQ

**Q: Is this truly fair?**  
A: Yes. Outcomes are derived from Drand, which uses threshold cryptography. No fewer than 1 participants can forge or suppress a Drand round.

**Q: Who runs Drand?**  
A: Drand is run by the League of Entropy (Cloudflare, Protocol Labs, Ethereum Foundation, others). Access at https://drand.love/ or via API at https://api.drand.sh/

**Q: Can I use this in real games?**  
A: Yes. You can deploy the DrandGame contract yourself or use the deployed address. Any outcome is verifiable by anyone.

**Q: How are gas costs paid?**  
A: Each player pays gas for their transactions. Platform deployers can add a 2% fee (customizable).

**Q: What if Drand is unavailable?**  
A: The protocol locks a specific round, so you can always look it up later on https://drand.love/ or via the API.

## Learning Resources

- **Protocol Spec**: `../docs/DETERMINISTIC_MATH.md`
- **Contract Code**: `../contract/contracts/DrandGame.sol`
- **Security Model**: `../docs/PHASE_4_DRAND_COMPLETE.md`
- **Full Status**: `../docs/PROJECT_STATUS.md`

## License

MIT - Use freely for learning, research, and production.

---

**Ready to play?**

```bash
python3 game.py
```

May the Drand odds be ever in your favor! 🎲
