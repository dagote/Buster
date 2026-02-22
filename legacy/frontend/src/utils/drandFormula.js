/**
 * DRAND FORMULA - PUBLIC AND VERIFIABLE
 * 
 * This is the CORE of the Bitcino protocol.
 * The math MUST be transparent so anyone can verify game outcomes.
 * 
 * Given: A random number from Drand (512-bit integer)
 * Output: A dice total from 1-12 (two dice, each 1-6)
 * 
 * Formula:
 *   diceTotal = (drandValue % 12) + 1
 * 
 * This formula:
 * ✅ Is deterministic (same drand_value → same result always)
 * ✅ Is verifiable (anyone can calculate it)
 * ✅ Is public (published in code, blockchain, and docs)
 * ✅ Is immutable (cannot be changed once deployed)
 * 
 * Example:
 *   drandValue = 999888777
 *   diceTotal = (999888777 % 12) + 1 = 6
 *   
 *   Frontend can then display:
 *   - 1 + 5
 *   - 2 + 4
 *   - 3 + 3
 *   All are valid as long as sum = 6
 */

export const DRAND_FORMULA_DESCRIPTION = `
Public Formula: diceTotal = (drandValue % 12) + 1
Where:
  - drandValue = Large random integer from Drand beacon
  - diceTotal = Result value (1-12)
  - % = Modulo operator (remainder after division)
  - + 1 = Shift range from 0-11 to 1-12
`;

/**
 * Convert Drand random value to dice total (1-12)
 * @param {number | string} drandValue - Raw Drand randomness value
 * @returns {number} Dice total (1-12)
 */
export function getDiceTotalFromDrand(drandValue) {
  const value = typeof drandValue === 'string' ? parseInt(drandValue, 10) : drandValue;
  return (value % 12) + 1;
}

/**
 * Split a dice total into two valid dice (1-6 each)
 * Uses local randomness for display only - total must match Drand value
 * @param {number} total - The public total (1-12) from Drand
 * @returns {object} {die1: 1-6, die2: 1-6}
 */
export function splitDiceTotal(total) {
  if (total < 2 || total > 12) {
    throw new Error('Dice total must be between 2 and 12');
  }
  
  // Local random split (for animation/display only)
  // The actual constraint is that die1 + die2 === total
  const die1 = Math.floor(Math.random() * Math.min(6, total - 1)) + 1;
  const die2 = total - die1;
  
  if (die2 < 1 || die2 > 6) {
    return splitDiceTotal(total); // Retry if invalid
  }
  
  return { die1, die2 };
}

/**
 * Verify that a dice roll matches the expected Drand value
 * @param {number} drandValue - The Drand random value
 * @param {number} die1 - First die (1-6)
 * @param {number} die2 - Second die (1-6)
 * @returns {boolean} True if dice sum matches Drand formula output
 */
export function verifyDiceRoll(drandValue, die1, die2) {
  const expected = getDiceTotalFromDrand(drandValue);
  const actual = die1 + die2;
  return actual === expected;
}

/**
 * Generate verification link for a game result
 * Users can visit drandbeacon.io/round/{round} to verify
 * @param {number} drandRound - The Drand round number
 * @returns {string} URL to verify the Drand randomness
 */
export function getDrandVerificationLink(drandRound) {
  return `https://drandbeacon.io/round/${drandRound}`;
}
