#!/usr/bin/env python3
"""
Demonstrate the auto-verification game flow
"""

from game import (
    DrandVerifier, fetch_drand_value, calculate_outcome, 
    lock_guess, format_drand_value
)
import secrets

def demo_auto_verification():
    """Show auto-verification in action"""
    
    print("\n" + "=" * 70)
    print("🎲 AUTO-VERIFICATION DEMO - BUSTER PROTOCOL GAME")
    print("=" * 70 + "\n")
    
    verifier = DrandVerifier()
    
    # Setup
    print("🔧 PHASE 1: SETUP")
    print("-" * 70)
    game_id = secrets.token_hex(16)
    drand_round = 17598
    print(f"  Game ID:           {game_id}")
    print(f"  Drand Round:       {drand_round}")
    print()
    
    # Player guess
    print("🎯 PHASE 2: PLAYER GUESS")
    print("-" * 70)
    player_guess = 2  # Demo guess
    print(f"  Player Guess:      {player_guess}")
    commitment = lock_guess(player_guess)
    print(f"  Commitment:        {commitment[:40]}...")
    print()
    
    # Drand revealed
    print("⚛️  PHASE 3: DRAND REVEALED")
    print("-" * 70)
    drand_value = fetch_drand_value(drand_round, verifier)
    print(f"  Source:            League of Entropy")
    print(f"  Round:             {drand_round}")
    print(f"  Randomness (hex):  {format_drand_value(drand_value)}")
    print(f"  Verifiable at:     https://drand.love/round/{drand_round}")
    print()
    
    # Calculate outcome
    print("🧮 PHASE 4: OUTCOME CALCULATION")
    print("-" * 70)
    outcome = calculate_outcome(drand_value, 1, 6)
    print(f"  Formula:           outcome = (drandValue % 6) + 1")
    print(f"  Calculation:       ({drand_value} % 6) + 1 = {outcome}")
    print(f"  Outcome:           {outcome}")
    print()
    
    # AUTO-VERIFY
    print("✅ PHASE 5: AUTO-VERIFICATION")
    print("-" * 70)
    verification_result = verifier.verify_game(drand_round, outcome, 1, 6)
    
    if verification_result['valid']:
        print(f"  Status:            ✅ VERIFIED")
        print(f"  Round:             {verification_result['round']}")
        print(f"  Outcome:           {verification_result['actual_outcome']}")
        print(f"  Randomness:        {verification_result['randomness'][:50]}...")
        print(f"  Match:             {verification_result['claimed_outcome']} == {verification_result['actual_outcome']} ✓")
        print(f"  Explanation:       {verification_result['explanation']}")
    else:
        print(f"  Status:            ❌ VERIFICATION FAILED")
    print()
    
    # Result
    print("🎮 GAME RESULT")
    print("-" * 70)
    player_won = player_guess == outcome
    
    if player_won:
        print(f"  🎉 YOU WON!")
        print(f"  Guess:             {player_guess}")
        print(f"  Outcome:           {outcome}")
        print(f"  Result:            ✅ MATCH")
    else:
        print(f"  ❌ You lost")
        print(f"  Guess:             {player_guess}")
        print(f"  Outcome:           {outcome}")
    print()
    
    # Public audit trail
    print("📋 PUBLIC AUDIT TRAIL")
    print("-" * 70)
    print("This game outcome is verifiable by anyone:")
    print()
    print(f"  1. Visit:          https://drand.love/")
    print(f"  2. Look up:        Round {drand_round}")
    print(f"  3. Get value:      {format_drand_value(drand_value)}")
    print(f"  4. Calculate:      ({drand_value} % 6) + 1 = {outcome}")
    print(f"  5. Contract:       https://polygonscan.com/address/0x48F50771...")
    print()
    print("=" * 70)
    print("Auto-verification completed successfully!")
    print("=" * 70 + "\n")

if __name__ == '__main__':
    demo_auto_verification()
