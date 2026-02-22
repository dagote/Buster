#!/usr/bin/env python3
"""Test verification system with real Drand round 17598"""

from verify import DrandVerifier

def main():
    verifier = DrandVerifier()
    
    print('\n✅ VERIFICATION TEST WITH REAL DRAND DATA')
    print('='*60)
    
    test_cases = [
        (17598, 2, 1, 6, True, 'Single die - guessed 2, wins'),
        (17598, 3, 1, 6, False, 'Single die - guessed 3, loses'),
        (17598, 7, 2, 12, True, 'Two dice - lucky 7'),
        (17598, 70, 1, 100, True, 'Percentile - 70th'),
        (17598, 1, 0, 1, False, 'Coin flip - guessed 0, loses'),
        (17598, 45, 0, 51, True, 'Card game - card 45'),
    ]
    
    passed = 0
    for round_num, claim, min_val, max_val, expect_valid, desc in test_cases:
        result = verifier.verify_game(round_num, claim, min_val, max_val)
        actual_valid = result['valid']
        status = '✅ PASS' if actual_valid == expect_valid else '❌ FAIL'
        
        if actual_valid == expect_valid:
            passed += 1
        
        print(f'\n{status} | {desc}')
        print(f'     Actual outcome: {result["actual_outcome"]}')
        print(f'     Valid: {result["valid"]}')
    
    print('\n' + '='*60)
    print(f'Tests passed: {passed}/{len(test_cases)}')
    print('='*60 + '\n')
    
    # Show the Drand details
    print('📊 DRAND ROUND 17598 DETAILS:')
    print('='*60)
    verifier.display_round(17598)

if __name__ == '__main__':
    main()
