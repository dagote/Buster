"""
Tests for Bitcino Server
"""

import pytest
from app.game import DiceGame
from app.utils import (
    validate_eth_address,
    from_wei,
    to_wei,
)


class TestDiceGame:
    """Test dice game logic"""

    def test_roll_die_range(self):
        """Test die roll is between 1 and 6"""
        for _ in range(100):
            roll = DiceGame.roll_die()
            assert 1 <= roll <= 6

    def test_play_game(self):
        """Test complete game play"""
        result = DiceGame.play()

        assert "player1_roll" in result
        assert "player2_roll" in result
        assert "winner" in result
        assert "message" in result
        assert result["winner"] in [1, 2]
        assert 1 <= result["player1_roll"] <= 6
        assert 1 <= result["player2_roll"] <= 6

    def test_validate_roll(self):
        """Test roll validation"""
        assert DiceGame.validate_roll(1) is True
        assert DiceGame.validate_roll(6) is True
        assert DiceGame.validate_roll(0) is False
        assert DiceGame.validate_roll(7) is False


class TestUtils:
    """Test utility functions"""

    def test_validate_eth_address(self):
        """Test Ethereum address validation"""
        valid_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEb"
        invalid_address = "0xGGGG"

        assert validate_eth_address(valid_address) is True
        assert validate_eth_address(invalid_address) is False

    def test_from_wei(self):
        """Test wei conversion"""
        wei = 1000000000000000000  # 1 MATIC
        matic = from_wei(wei)
        assert abs(matic - 1.0) < 0.0001

    def test_to_wei(self):
        """Test MATIC to wei conversion"""
        matic = 1.5
        wei = to_wei(matic)
        assert wei == 1500000000000000000


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
