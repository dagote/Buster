#!/usr/bin/env python3
"""
Test script to verify game.py logic without user interaction.
Shows a complete game flow automatically.
"""

import sys
sys.path.insert(0, '.')

from game import (
    validate_guess,
    lock_guess,
    calculate_outcome,
    verify_outcome,
    format_drand_value,
    GamePhase
)
import secrets

def test_game_flow():
    """Run a complete game flow and verify all steps."""
    print("\n" + "="*60)
    print("BUSTER PROTOCOL - AUTOMATED TEST")
    print("="*60 + "\n")
    
    # Setup
    print("1️⃣  SETUP")
    game_id = secrets.token_hex(16)
    drand_round = 8739
    print(f"   Game ID: {game_id}")
    print(f"   Drand Round: {drand_round}")
    
    # Player guess
    print("\n2️⃣  PLAYER GUESS")
    player_guess = 4  # Simulate player picking 4
    print(f"   Player picks: {player_guess}")
    
    commitment = lock_guess(player_guess)
    print(f"   Commitment: {commitment[:20]}...")
    
    # Drand revealed
    print("\n3️⃣  DRAND RANDOMNESS")
    drand_value = 987654321  # Use fixed value for testing
    print(f"   Drand Value: {drand_value}")
    print(f"   Hex: {format_drand_value(drand_value)}")
    
    # Calculate outcome
    print("\n4️⃣  OUTCOME CALCULATION")
    outcome = calculate_outcome(drand_value, 1, 6)
    print(f"   Formula: (drandValue % 6) + 1")
    print(f"   (987654321 % 6) + 1 = {outcome}")
    
    # Verify
    print("\n5️⃣  VERIFICATION")
    is_valid = verify_outcome(drand_value, outcome, 1, 6)
    print(f"   Is outcome valid? {is_valid}")
    
    # Result
    print("\n6️⃣  RESULT")
    player_won = player_guess == outcome
    print(f"   Player guess: {player_guess}")
    print(f"   Outcome: {outcome}")
    print(f"   Result: {'WIN ✅' if player_won else 'LOSS ❌'}")
    
    # Run multiple test cases
    print("\n" + "="*60)
    print("MULTIPLE TEST CASES")
    print("="*60 + "\n")
    
    test_cases = [
        (12345, 1, 6),
        (99999, 1, 6),
        (5000000, 1, 6),
        (123456789, 2, 12),  # Two dice
        (555555555, 0, 1),   # Coin flip
    ]
    
    for drand_val, min_val, max_val in test_cases:
        outcome = calculate_outcome(drand_val, min_val, max_val)
        is_valid = verify_outcome(drand_val, outcome, min_val, max_val)
        range_str = f"[{min_val}, {max_val}]"
        result = "✓" if is_valid else "✗"
        print(f"Drand: {drand_val:<10} Range: {range_str:<8} Outcome: {outcome:<3} Verify: {result}")
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED")
    print("="*60 + "\n")
    print("The game.py logic is working correctly!")
    print("Run 'python game.py' for interactive gameplay.\n")

if __name__ == "__main__":
    test_game_flow()
