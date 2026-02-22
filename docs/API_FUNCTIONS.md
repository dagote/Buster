# Buster Protocol - Function Reference

## Core Python API (`protocol/seed.py`)

### 1. SeedManager Class

#### `__init__()`
Initialize an in-memory seed manager.

```python
from protocol import SeedManager
mgr = SeedManager()
```

#### `create_seed(seat: str) -> str`
Generate a new seed and return its SHA256 commitment.

```python
commitment = mgr.create_seed("alice")
# commitment = "a1b2c3d4e5f6..." (64-char hex)
```

**Returns:** Hex string of SHA256 commitment  
**Raises:** `ValueError` if seed already exists for seat

#### `reveal_seed(seat: str) -> str`
Reveal the raw seed (hex-encoded) for verification.

```python
seed_hex = mgr.reveal_seed("alice")
# seed_hex = "f1e2d3c4b5a6..." (64-char hex)
```

**Returns:** Hex-encoded seed  
**Raises:** `KeyError` if seat not found

#### `verify_commitment(seat: str, seed_hex: str) -> bool`
Verify that a seed matches the published commitment.

```python
is_valid = mgr.verify_commitment("alice", seed_hex)
# is_valid = True
```

**Returns:** `True` if seed matches commitment, `False` otherwise

---

## Smart Contract API (Solidity)

### DrandGame Contract

**Address:** `0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43` (Polygon mainnet)

#### `lockDrandRound(uint256 _round, uint256 _guess)`
Lock in a game round and guess.

```javascript
contract.lockDrandRound(17598, 3); // Round 17598, guess 3 (1-6)
```

#### `calculateOutcome(uint256 _bet) -> uint8`
Get the deterministic outcome for a round.

```javascript
uint8 outcome = contract.calculateOutcome(17598);
// outcome = 5 (1-6 result)
```

#### `verifyOutcome(uint256 _drandRound, uint8 _expectedOutcome) -> bool`
Verify that an outcome matches Drand data.

```javascript
bool isValid = contract.verifyOutcome(17598, 5);
// isValid = true
```

---

## Demo Scripts Reference

### `game.py`
Interactive gameplay with 5-phase walkthrough.

```bash
python game.py
```

**Uses:** `SeedManager`  
**Input:** User picks 1-6  
**Output:** Win/lose + verification link  
**Time:** ~2 seconds

### `test_game.py`
Automated tests (no user input).

```bash
python test_game.py
```

**Uses:** `SeedManager`  
**Input:** None (automated)  
**Output:** Test results  
**Time:** ~1 second

### `verify.py`
Verification utilities for independent checking.

```python
from demo.verify import DrandVerifier
verifier = DrandVerifier()
result = verifier.verify_game(17598, 2, 1, 6)
print(result)  # {'valid': True, ...}
```

### `demo_real_drand.py`
Fetch real Drand data and verify outcomes.

```bash
python demo_real_drand.py
```

### `analyze_fairness.py`
Run 10,000+ simulations to prove uniform distribution.

```bash
python analyze_fairness.py
```

---

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `WALLET_ADDRESS` | Your Polygon wallet | `0x742d...Eb4c` |
| `POLYGON_RPC_URL` | Blockchain RPC endpoint | `https://polygon-rpc.com` |
| `PRIVATE_KEY` | Deployer private key (development only) | `abc123...` |
| `SEEDCOMMIT_ADDRESS` | Phase 3 contract | `0x0f4e...fECBa` |
| `DRANDGAME_ADDRESS` | Phase 4 contract | `0x48F5...0D43` |

---

## Common Tasks

### Play a game
```bash
cd demo && python game.py
```

### Run all tests
```bash
cd demo
python test_game.py
python test_real_drand.py
python analyze_fairness.py
```

### Verify an outcome manually
```python
from demo.verify import DrandVerifier
verifier = DrandVerifier()
verifier.verify_game(17598, 2, 1, 6)  # Round, guess, min, max
```

### Create a seed (in Python)
```python
from protocol import SeedManager
mgr = SeedManager()
commitment = mgr.create_seed("player1")
seed = mgr.reveal_seed("player1")
assert mgr.verify_commitment("player1", seed)
```

### Check Drand randomness
```bash
# Fetch round 17598
curl https://api.drand.sh/public/17598

# Or visit: https://drand.love/
```

---

## Zero Dependencies

The entire protocol uses only Python stdlib:
- ✅ `hashlib` (SHA256)
- ✅ `secrets` (cryptographic randomness)
- ✅ No pip packages required

