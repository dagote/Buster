#!/usr/bin/env python3
"""Test auto-verification system"""

from game import DrandVerifier, fetch_drand_value, calculate_outcome

verifier = DrandVerifier()
drand_round = 17598
drand_value = fetch_drand_value(drand_round, verifier)
outcome = calculate_outcome(drand_value, 1, 6)

print('\nAuto-Verification Test')
print('='*60)
print(f'Drand Round: {drand_round}')
print(f'Drand Value: {drand_value}')
print(f'Calculated Outcome: {outcome}')
print()

# Auto-verify
result = verifier.verify_game(drand_round, outcome, 1, 6)
print(f'✅ Verification: {result["valid"]}')
print(f'   Explanation: {result["explanation"]}')
print('='*60 + '\n')
