"""
Dice game logic for Buster with Drand-based randomness

Game rules:
- Each player rolls based on Drand randomness
- Highest roll wins
- Outcome is deterministic and publicly verifiable
- No server discretion
"""

from typing import Dict


class DiceGame:
    """Dice game logic using Drand randomness"""

    @staticmethod
    def derive_rolls_from_drand(drand_value: int) -> Dict:
        """
        Derive deterministic dice rolls from Drand randomness.

        This function must be identical on-chain and off-chain.
        Anyone can verify the outcome by:
        1. Getting the drand value from drandbeacon.io
        2. Running this same calculation
        3. Checking against contract settlement

        Args:
            drand_value: Integer from Drand randomness

        Returns:
            {
                "player1_roll": 1-6,
                "player2_roll": 1-6,
                "winner": 1 or 2,
                "message": "Player X wins with Y vs Z"
            }
        """
        # Use different slices of the Drand value for each player
        # This prevents correlation between rolls
        player1_roll = (drand_value % 6) + 1
        player2_roll = ((drand_value >> 8) % 6) + 1

        # Determine winner
        if player1_roll > player2_roll:
            winner = 1
            message = f"Player 1 wins with {player1_roll} vs {player2_roll}"
        elif player2_roll > player1_roll:
            winner = 2
            message = f"Player 2 wins with {player2_roll} vs {player1_roll}"
        else:
            # Extremely rare: equal rolls
            winner = 1  # Give to player 1 on tie
            message = f"Tie! Both rolled {player1_roll}. Player 1 wins on tie."

        return {
            "player1_roll": player1_roll,
            "player2_roll": player2_roll,
            "winner": winner,
            "message": message,
        }

    @staticmethod
    def validate_rolls(player1: int, player2: int) -> bool:
        """Validate rolls are in valid range (1-6)"""
        return 1 <= player1 <= 6 and 1 <= player2 <= 6

