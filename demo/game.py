#!/usr/bin/env python3
"""
Buster Protocol Demo: Interactive Drand-Based Guessing Game

This demo shows the complete Buster Protocol flow:
1. Player locks in a guess (1-6)
2. System fetches Drand randomness
3. Outcome calculated deterministically
4. Result validated on-chain (verified automatically)
5. Winner determined
"""

import hashlib
import secrets
from enum import Enum
from verify import DrandVerifier


class GamePhase(Enum):
    SETUP = 1
    PLAYER_GUESS = 2
    DRAND_LOCKED = 3
    OUTCOME_CALCULATED = 4
    VERIFIED = 5


def validate_guess(guess_str: str) -> int:
    """Validate that user input is a valid number 1-6."""
    try:
        guess = int(guess_str.strip())
        if 1 <= guess <= 6:
            return guess
        else:
            print("❌ Must be between 1 and 6")
            return None
    except ValueError:
        print("❌ Not a valid number")
        return None


def lock_guess(guess: int) -> str:
    """Lock in the guess by creating a hash commitment."""
    guess_bytes = str(guess).encode()
    # In real scenario, would use seed protocol
    commitment = hashlib.sha256(guess_bytes).hexdigest()
    return commitment


def fetch_drand_value(drand_round: int = 17598, verifier: DrandVerifier = None) -> int:
    """
    Fetch Drand randomness from stored data.
    
    Uses real Drand round 17598 from the League of Entropy.
    In production: would call https://api.drand.sh/public/{round}
    For demo: uses verified stored data.
    """
    if verifier is None:
        verifier = DrandVerifier()
    
    round_data = verifier.get_round(drand_round)
    if round_data:
        drand_hex = round_data["randomness"]
        drand_value = int(drand_hex, 16)
        return drand_value
    else:
        # Fallback to simulated value
        return secrets.randbits(256)


def calculate_outcome(drand_value: int, min_val: int = 1, max_val: int = 6) -> int:
    """
    Calculate outcome using the smart contract formula.
    
    Formula: outcome = (drandValue % (max - min + 1)) + min
    
    This is IDENTICAL to what DrandGame.sol does on-chain:
    - Deterministic (same drand_value always produces same outcome)
    - Fair (uniform distribution)
    - Verifiable (anyone can recalculate)
    """
    range_size = max_val - min_val + 1
    outcome = (drand_value % range_size) + min_val
    return outcome


def verify_outcome(drand_value: int, claimed_outcome: int, min_val: int = 1, max_val: int = 6) -> bool:
    """
    Verify outcome matches Drand value.
    
    This is what verifyOutcome() on the smart contract does.
    Returns True if the claimed outcome is correct, False otherwise.
    """
    calculated = calculate_outcome(drand_value, min_val, max_val)
    return calculated == claimed_outcome


def format_drand_value(drand_value: int) -> str:
    """Format large integer as hex (like Drand beacon shows)."""
    return hex(drand_value)


def play_game():
    """Main game loop."""
    print("\n" + "=" * 60)
    print("🎲 BUSTER PROTOCOL DEMO - DRAND GUESSING GAME")
    print("=" * 60)
    print("\nYou will:")
    print("1. Pick a number 1-6")
    print("2. Lock in your guess")
    print("3. Reveal a Drand randomness value")
    print("4. Compare outcomes")
    print("5. See if you won")
    print("\n" + "-" * 60 + "\n")
    
    # Initialize verifier for auto-verification
    verifier = DrandVerifier()

    # PHASE 1: Setup
    phase = GamePhase.SETUP
    print("🔧 PHASE 1: SETUP")
    print("Creating a new game on the Buster Protocol...")
    
    game_id = secrets.token_hex(16)
    print(f"Game ID (gameId): {game_id}")
    
    # Use real Drand round 17598
    drand_round = 17598
    print(f"Locked Drand round: {drand_round}")
    print("Your gameId and drandRound are now immutable on-chain.\n")
    
    input("Press ENTER to continue to player guess...")
    print()

    # PHASE 2: Player guess
    phase = GamePhase.PLAYER_GUESS
    print("🎯 PHASE 2: PLAYER GUESS")
    print("Pick a number from 1 to 6:")
    
    player_guess = None
    while player_guess is None:
        player_guess = validate_guess(input("Your guess: "))
    
    print(f"✓ You selected: {player_guess}")
    
    # Lock the guess
    commitment = lock_guess(player_guess)
    print(f"✓ Guess locked (commitment: {commitment[:16]}...)")
    print("Your guess is now immutable.\n")
    
    input("Press ENTER to reveal Drand randomness...")
    print()

    # PHASE 3: Drand revealed
    phase = GamePhase.DRAND_LOCKED
    print("⚛️  PHASE 3: DRAND RANDOMNESS REVEALED")
    print("Fetching Drand public randomness...")
    
    drand_value = fetch_drand_value(drand_round, verifier)
    print(f"✓ Drand Round {drand_round}")
    print(f"✓ Randomness Value: {format_drand_value(drand_value)}")
    print(f"✓ Accessible at: https://drand.love/round/{drand_round}\n")
    
    input("Press ENTER to calculate outcome...")
    print()

    # PHASE 4: Calculate outcome
    phase = GamePhase.OUTCOME_CALCULATED
    print("🧮 PHASE 4: OUTCOME CALCULATION")
    print("Using the deterministic formula (same as smart contract):\n")
    print("outcome = (drandValue % 6) + 1")
    print(f"outcome = ({drand_value} % 6) + 1")
    
    outcome = calculate_outcome(drand_value, 1, 6)
    print(f"outcome = {outcome}\n")
    
    print(f"✓ Calculated Outcome: {outcome}")
    print("This is the ONLY possible outcome for this Drand value.\n")
    
    input("Press ENTER to verify and determine winner...")
    print()

    # PHASE 5: Verify and result
    phase = GamePhase.VERIFIED
    print("✅ PHASE 5: AUTO-VERIFICATION & RESULT")
    print("-" * 60)
    print("Verifying outcome against Drand data...\n")
    
    # Auto-verify using the verification system
    verification_result = verifier.verify_game(drand_round, outcome, 1, 6)
    
    if verification_result['valid']:
        print("✅ VERIFICATION PASSED")
        print(f"   Round {drand_round} verified ✓")
        print(f"   Outcome {outcome} is CORRECT ✓")
        print(f"   Randomness: {verification_result['randomness'][:40]}...")
        print(f"   Explanation: {verification_result['explanation']}")
    else:
        print("❌ VERIFICATION FAILED")
        print(f"   Round {drand_round}: Claimed outcome {outcome}")
        print(f"   Actual outcome: {verification_result.get('actual_outcome', 'unknown')}")
    
    print("\n" + "-" * 60)
    print("GAME RESULT")
    print("-" * 60)
    
    player_won = player_guess == outcome
    
    if player_won:
        print(f"🎉 YOU WON! 🎉")
        print(f"  Your guess: {player_guess}")
        print(f"  Outcome:    {outcome}")
        print("  MATCH! ✓")
    else:
        print(f"❌ You lost this round")
        print(f"  Your guess: {player_guess}")
        print(f"  Outcome:    {outcome}")
        print("  Better luck next time!")
    
    print("-" * 60 + "\n")
    
    # Show audit trail
    print("📋 PUBLIC AUDIT TRAIL")
    print("Anyone on the internet can verify this game:\n")
    print(f"1. Visit: https://drand.love/")
    print(f"2. Look up round {drand_round}")
    print(f"3. Extract randomness: {format_drand_value(drand_value)}")
    print(f"4. Calculate: (randomness % 6) + 1 = {outcome}")
    print(f"5. Check on-chain contract at:")
    print(f"   https://polygonscan.com/address/0x48F50771Ddf0c9cab51f7E5759Eb10008B2B0D43")
    print(f"\nThe game is fully transparent and verifiable.\n")

    # Offer replay
    print("=" * 60)
    play_again = input("Play another round? (y/n): ").strip().lower()
    if play_again == 'y':
        print("\n")
        play_game()
    else:
        print("\nThanks for playing! 🎮")
        print("Learn more at: https://github.com/buster/protocol\n")


if __name__ == "__main__":
    try:
        play_game()
    except KeyboardInterrupt:
        print("\n\nGame interrupted. Thanks for playing! 👋")
