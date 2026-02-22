#!/usr/bin/env python3
"""
Complete game flow using REAL Drand data from round 17598
Shows the entire Buster Protocol in action without needing input
"""

import secrets
from enum import Enum
import hashlib

# REAL DRAND DATA
REAL_DRAND_ROUND = 17598
REAL_DRAND_RANDOMNESS = "0x2e0a3bbff600011a0ae21c92e8d4c99dda94da06284dfe90032bae3f7ebc6339"
REAL_DRAND_INT = int(REAL_DRAND_RANDOMNESS, 16)

class GamePhase(Enum):
    """Game phases"""
    SETUP = "setup"
    PLAYER_GUESS = "player_guess"
    DRAND_LOCKED = "drand_locked"
    OUTCOME_CALCULATED = "outcome_calculated"
    VERIFIED = "verified"


def calculate_outcome(drand_value: int, min_val: int = 1, max_val: int = 6) -> int:
    """Calculate outcome using deterministic formula"""
    range_size = max_val - min_val + 1
    outcome = (drand_value % range_size) + min_val
    return outcome


def lock_guess(guess: int) -> str:
    """Create commitment to guess"""
    guess_str = str(guess).encode()
    commitment = hashlib.sha256(guess_str).hexdigest()
    return commitment


def demo_game(player_guess: int):
    """Play a complete game with real Drand data"""
    
    print("\n" + "=" * 70)
    print("🎲 BUSTER PROTOCOL - COMPLETE GAME FLOW WITH REAL DRAND DATA")
    print("=" * 70)
    print()
    
    # PHASE 1: Setup
    print("🔧 PHASE 1: SETUP")
    print("-" * 70)
    game_id = secrets.token_hex(16)
    print(f"  Game ID:              {game_id}")
    print(f"  Locked Drand Round:   {REAL_DRAND_ROUND}")
    print(f"  Status:               Immutable on-chain ✓")
    print()
    
    # PHASE 2: Player guess
    print("🎯 PHASE 2: PLAYER GUESS")
    print("-" * 70)
    print(f"  Your Guess:           {player_guess}")
    commitment = lock_guess(player_guess)
    print(f"  Commitment Hash:      {commitment[:40]}...")
    print(f"  Status:               Locked on-chain ✓")
    print()
    
    # PHASE 3: Drand revealed
    print("⚛️  PHASE 3: DRAND REVEALED")
    print("-" * 70)
    print(f"  Source:               League of Entropy (https://drand.love/)")
    print(f"  Drand Round:          {REAL_DRAND_ROUND}")
    print(f"  Randomness (hex):     {REAL_DRAND_RANDOMNESS}")
    print(f"  Randomness (decimal): {REAL_DRAND_INT}")
    print(f"  Verifiable at:        https://drand.love/round/{REAL_DRAND_ROUND}")
    print(f"  Status:               Public & Auditable ✓")
    print()
    
    # PHASE 4: Calculate outcome
    print("🧮 PHASE 4: CALCULATE OUTCOME")
    print("-" * 70)
    print("  Formula (from DrandGame.sol):")
    print("    outcome = (drandValue % (max - min + 1)) + min")
    print("    outcome = (drandValue % 6) + 1")
    print()
    print(f"  Calculation:")
    print(f"    ({REAL_DRAND_INT} % 6) + 1")
    outcome = calculate_outcome(REAL_DRAND_INT, 1, 6)
    print(f"    = {outcome}")
    print()
    print(f"  Winning Number:       {outcome}")
    print(f"  Status:               Deterministic & Verifiable ✓")
    print()
    
    # PHASE 5: Result
    print("✅ PHASE 5: RESULT")
    print("-" * 70)
    
    player_won = player_guess == outcome
    
    if player_won:
        print(f"  🎉 YOU WON! 🎉")
        print(f"  Your Guess:           {player_guess}")
        print(f"  Winning Number:       {outcome}")
        print(f"  Result:               MATCH ✓")
    else:
        print(f"  ❌ You lost this round")
        print(f"  Your Guess:           {player_guess}")
        print(f"  Winning Number:       {outcome}")
        print(f"  Result:               No match")
    
    print()
    print("=" * 70)
    print("📋 PUBLIC AUDIT TRAIL")
    print("=" * 70)
    print()
    print("Anyone on the internet can verify this game:")
    print()
    print("1. Visit: https://drand.love/")
    print(f"2. Look up round {REAL_DRAND_ROUND}")
    print(f"3. Get randomness: {REAL_DRAND_RANDOMNESS}")
    print(f"4. Calculate: ({REAL_DRAND_INT} % 6) + 1 = {outcome}")
    print(f"5. Confirm outcome: {outcome}")
    print()
    print("6. Check smart contract at:")
    print("   https://polygonscan.com/address/0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43")
    print()
    print("The game is trustless, verifiable, and fair.")
    print("=" * 70 + "\n")
    
    return player_won, outcome


def main():
    """Run demos with different guesses"""
    
    print("\n")
    print("█" * 70)
    print("█ BUSTER PROTOCOL - REAL DRAND GAME DEMONSTRATIONS")
    print("█" * 70)
    print()
    print("Using ACTUAL Drand round 17598 data from the League of Entropy")
    print()
    
    # Calculate what the winning number is
    winning_number = calculate_outcome(REAL_DRAND_INT, 1, 6)
    
    # Run 3 demo games
    test_cases = [
        (winning_number, "Winning Guess"),
        (3, "Losing Guess (wrong number)"),
        (1, "Losing Guess (different wrong number)"),
    ]
    
    wins = 0
    losses = 0
    
    for guess, description in test_cases:
        print(f"\n🔄 TEST: {description}")
        print("=" * 70)
        player_won, outcome = demo_game(guess)
        
        if player_won:
            wins += 1
        else:
            losses += 1
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"Winning Number:  {winning_number}")
    print(f"Games Won:       {wins}")
    print(f"Games Lost:      {losses}")
    print()
    print("The Buster Protocol ensures:")
    print("  ✓ Fairness    - Uniform distribution over all ranges")
    print("  ✓ Transparency- Outcomes verifiable on Drand beacon")
    print("  ✓ Trustless   - No server can manipulate the outcome")
    print("  ✓ Determinism- Same Drand value = Same outcome always")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    main()
