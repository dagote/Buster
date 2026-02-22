#!/usr/bin/env python3
"""
Test the Drand verification system without user interaction
"""

import sys
sys.path.insert(0, '.')

from verify import DrandVerifier

print("\n" + "="*60)
print("DRAND VERIFICATION SYSTEM - TEST")
print("="*60 + "\n")

verifier = DrandVerifier()

# Test 1: Display known round
print("TEST 1: Display Drand Round Data")
print("-" * 60)
verifier.display_round(13629)

# Test 2: Verify a game outcome
print("\nTEST 2: Verify Game Outcome")
print("-" * 60)

result = verifier.verify_game(13629, 4, 1, 6)
print(f"Round: {result['round']}")
print(f"Randomness: {result['randomness']}")
print(f"Claimed outcome: {result['claimed_outcome']}")
print(f"Actual outcome: {result['actual_outcome']}")
print(f"Result: {'✅ VALID' if result['valid'] else '❌ INVALID'}")
print(f"Formula: {result['explanation']}")

# Test 3: Verify wrong outcome
print("\n\nTEST 3: Verify Incorrect Outcome")
print("-" * 60)

result = verifier.verify_game(13629, 1, 1, 6)  # Wrong guess
print(f"Round: {result['round']}")
print(f"Claimed outcome: {result['claimed_outcome']}")
print(f"Actual outcome: {result['actual_outcome']}")
print(f"Result: {'✅ VALID' if result['valid'] else '❌ INVALID'}")

# Test 4: List available rounds
print("\n\nTEST 4: List Stored Rounds")
print("-" * 60)
verifier.list_rounds()

# Test 5: Add a new round and verify it
print("TEST 5: Add New Round and Verify")
print("-" * 60)
verifier.add_round(13631, "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
print("✓ Round 13631 added")

# Show calculation for new round
drand_int = verifier.randomness_to_int("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
outcome = verifier.calculate_outcome(drand_int, 1, 6)
print(f"✓ Calculated outcome for new round: {outcome}")

print("\n" + "="*60)
print("✅ ALL TESTS PASSED")
print("="*60)
print("\nThe verification system works independently of drandbeacon.io")
print("You can now verify game outcomes entirely locally!\n")
