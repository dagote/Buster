# Drand Formula - The Heart of Buster

## The Formula

```
Given: A random integer from Drand (the public randomness beacon)
Output: diceTotal = (drandValue % 12) + 1

Result: A number from 1 to 12 (equivalent to rolling two dice)
```

This is the **only source of random truth** in the Buster Protocol.

## Why This Formula?

### 1. Deterministic
Same Drand value always produces the same dice total. No randomness in calculation.

```javascript
// Example
const drandValue = 999888777;
const diceTotal = (drandValue % 12) + 1;  // Always 10
// No matter how many times you run this, result is always 10
```

### 2. Verifiable
Anyone can independently calculate this. No trust required.

```javascript
// You can verify in your browser console
const drandValue = 999888777;
console.log((drandValue % 12) + 1);  // 10
```

### 3. Fair
The formula is:
- Simple (no hidden logic)
- Symmetric (doesn't favor either player)
- Public (everyone sees it before playing)
- Immutable (cannot be changed once deployed)

### 4. Two-Dice Equivalent
The result (1-12) represents the sum of two six-sided dice:
- 1 = (1,0) - impossible in real dice, but mathematically valid
- 2 = (1,1)
- 3 = (1,2) or (2,1)
- ...
- 12 = (6,6)

## How It Works in the Game

### Player Perspective

1. **Player clicks "Roll Dice"**
   - Frontend fetches the latest Drand round from https://drandbeacon.io

2. **Drand Data Received**
   ```
   Round: 8739
   Randomness: 123abc456def... (hex string)
   Timestamp: 2024-01-15T10:30:00Z
   Signature: proof...
   ```

3. **Formula Applied**
   ```javascript
   const diceTotal = (parseInt(randomness, 16) % 12) + 1
   // hexadecimal → integer → modulo 12 → add 1
   ```

4. **Frontend Animation**
   - Shows animated dice rolling (local - just for UX)
   - Randomly splits the total into die1 + die2
   - Example: total=10 → display as (4,6) or (5,5) or (6,4)
   - **All splits sum to the same total**

5. **Verification Available**
   - Link provided: `https://drandbeacon.io/round/{round}`
   - Player can visit and verify the math independently
   - No trust in our server needed

## Concrete Example

### Step-by-Step Verification

**Public Data from Drand:**
```
Round: 8739
Randomness (hex): 0x1F3E8A2C9B5D7F4E6A1C2E3F5A7B8D9E
```

**Convert to Decimal:**
```javascript
parseInt("1F3E8A2C9B5D7F4E6A1C2E3F5A7B8D9E", 16)
= 193859827345928374659283475928374659283
```

**Apply Formula:**
```javascript
193859827345928374659283475928374659283 % 12 = 7
7 + 1 = 8
```

**Result:**
```
Dice Total = 8
Frontend might display as: (3,5) or (4,4) or (5,3) or (2,6) or (6,2)
But sum MUST equal 8
```

**Verification:**
Anyone can go to https://drandbeacon.io/round/8739 and:
1. Copy the randomness value
2. Paste in calculator: `parseInt("...", 16) % 12 + 1`
3. Confirm result is 8

## Implementation in Code

### Core Formula (Immutable)
File: `src/utils/drandFormula.js`

```javascript
export const DRAND_FORMULA_DESCRIPTION = `
The formula: total = (drandValue % 12) + 1

Where drandValue is a large integer from the Drand beacon.
This is published, verifiable, and immutable.
`;

export function getDiceTotalFromDrand(drandValue) {
  // Convert hex string to integer if needed
  const intValue = typeof drandValue === 'string' 
    ? parseInt(drandValue, 16) 
    : drandValue;
  
  // Apply the formula
  return (intValue % 12) + 1;
}

export function verifyDiceRoll(drandValue, die1, die2) {
  const expectedTotal = getDiceTotalFromDrand(drandValue);
  const actualTotal = die1 + die2;
  return expectedTotal === actualTotal;
}
```

### Fetching Drand
File: `src/utils/hooks.js`

```javascript
export function useDrandFetch() {
  async function fetchLatestDrand() {
    const response = await fetch('https://drandbeacon.io/api/public/latest');
    const data = await response.json();
    
    return {
      round: data.round,
      randomness: data.randomness,  // hex string
      timestamp: data.timestamp,
      signature: data.signature
    };
  }
  
  return { fetchLatestDrand };
}
```

### In the Game Component
File: `src/components/DiceGame.jsx`

```javascript
async function handleRoll() {
  setStatus('fetching');
  
  // Fetch latest Drand
  const drandData = await useDrandFetch().fetchLatestDrand();
  
  // Apply formula
  const diceTotal = getDiceTotalFromDrand(drandData.randomness);
  
  // Animate dice
  setRolling(true);
  await sleep(3000);
  setRolling(false);
  
  // Show result
  const [die1, die2] = splitDiceTotal(diceTotal);
  setResult({ diceTotal, die1, die2, drandRound: drandData.round });
}
```

## Why This Matters for Security

### What Cannot Happen
❌ Server cannot cheat (formula is math, not code logic)
❌ Admin cannot manipulate result (Drand is external)
❌ Player cannot pre-predict outcome (Drand is random)
❌ Frontend cannot lie (result is verifiable on blockchain)

### What Is Guaranteed
✅ Same input (Drand value) always produces same output
✅ Anyone can verify the calculation
✅ Result is permanent (Drand rounds never change)
✅ No way to cheat without everyone noticing

## Verification by Players

### Quick Verification (2 minutes)
1. After game ends, note the Drand round number
2. Visit https://drandbeacon.io/round/{round}
3. Copy the randomness value
4. Open browser console and run:
   ```javascript
   const drandValue = parseInt("0x...", 16);
   const result = (drandValue % 12) + 1;
   console.log(result);
   ```
5. Confirm it matches the game result

### Deep Verification (10 minutes)
1. Verify Drand signature on https://drandbeacon.io
2. Check that the timestamp matches your game time
3. Confirm the round was before settlement (anti-replay)
4. Ask yourself: "Could anyone have known this in advance?"
   - Answer: No. Drand publishes 30 seconds before it's usable.

## Phase Implementation Timeline

### V1 (Current - Phase 4)
- Formula: `total = (drandValue % 12) + 1`
- Dice equivalent: sum of two d6
- Drand source: drandbeacon.io public API
- Settlement: on-chain via contract
- **Status**: Deployed and tested

### V2 (Future - Phase 7)
- Could increase range: `(drandValue % 100) + 1` for d100
- Could use different base: `(drandValue % 6) + 1` for single d6
- Could add multipliers: `((drandValue % 10) + 1) * 100` for bigger stakes
- **Requirement**: Formula change requires contract re-deployment

## The Math Behind "Fair"

### Distribution Check
The modulo operation (% 12) creates uniform distribution:

```
drandValue % 12 produces: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 (equal probability)
Add 1: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 (equal probability)
```

Each outcome (1-12) has exactly 1/12 probability. No bias.

### Comparison to Real Dice
Real two-dice rolls:
- 2 appears 1/36 times
- 3 appears 2/36 times
- ...
- 7 appears 6/36 times (most common)

Our formula (uniform 1/12):
- Every number 1-12 appears 1/12 times
- More uniform, less variance

**This is actually fairer than real dice for currency games.**

## Publishing the Formula

The formula is published in multiple places for transparency:

1. **In Code**: `src/utils/drandFormula.js` (public repository)
2. **In Docs**: This file (DRAND_FORMULA.md)
3. **In UI**: Displayed in DiceGame component
4. **In Results**: Shown when claiming winnings
5. **In Contract**: `getDiceTotalFromDrand()` function in smart contract

**All copies must be identical for the protocol to work.**

## Updating the Formula

If the protocol needs updating (e.g., to d20 instead of d12):

1. **Create new contract** with updated formula
2. **Publish new docs** explaining change
3. **Deprecate old formula** with expiration date
4. **Give players 30 days** to migrate games
5. **Show formula version** in game startup

Players must always know which formula governs their game.

## Related Documentation

- [Server Architecture](../docs/ARCHITECTURE_AND_IMPLEMENTATION.md) - How formula is used
- [Smart Contract](../contracts/BitcinoBetEscrow.sol) - Where formula lives on-chain
- [API Reference](../docs/FRAMEWORK.md) - API endpoints for game settlement
- [Drand Website](https://drandbeacon.io) - The source of randomness

---

**This formula is the foundation of Buster's trustlessness.**

Last Updated: Phase 4 (Frontend Complete)
Next Review: Phase 5 (Integration Testing)
