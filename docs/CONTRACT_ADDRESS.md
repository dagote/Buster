# Published Contract Address

## Polygon Mainnet - LIVE ✅

### SeedCommit Contract
```
polygon: 0x0f4e83625223833460cF1f0f87fc4584CE5fECBa
```
- Stores seed+formula commitments on-chain
- Prevents retroactive formula changes
- Used in Phase 3 - Blockchain Commitment Layer
- Reference: https://polygonscan.com/address/0x0f4e83625223833460cF1f0f87fc4584CE5fECBa

### DrandGame Contract (Phase 4)
```
polygon: 0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43
```
- Trustless game protocol using Drand randomness
- Three functions:
  - `lockDrandRound(gameId, drandRound)` - Commit to a Drand round
  - `calculateOutcome(drandValue, min, max)` - Derive outcome deterministically
  - `verifyOutcome(gameId, drandValue, claimedOutcome, min, max)` - Validate outcome
- Deployed: 2026-02-22
- Deployer: 0xFD2FeF383462ad94acE909f0852e7E6404F38d8F
- Status: Active and verified
- Reference: https://polygonscan.com/address/0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43

**Protocol Properties:**
- ✅ Trustless - No server required, players deploy and use directly
- ✅ Verifiable - Anyone can audit outcomes on drandbeacon.io
- ✅ Scalable - Works for any outcome range (dice, percentiles, card games, etc)
- ✅ Deterministic - Same Drand round always produces same outcome