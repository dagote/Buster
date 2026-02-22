"""
Player matchmaking for Buster

Matches pending players together for bets.
Uses simple queue-based approach for MVP.
"""

from typing import Optional
from dataclasses import dataclass
from datetime import datetime
import asyncio


@dataclass
class PendingPlayer:
    """A player waiting for a match"""

    player_address: str
    bet_id: int
    amount: float
    game_type: str
    joined_at: datetime


class MatchmakingQueue:
    """Simple matchmaking queue"""

    def __init__(self):
        self.queue: list[PendingPlayer] = []

    def add_player(
        self, player_address: str, bet_id: int, amount: float, game_type: str
    ) -> None:
        """Add player to matchmaking queue"""
        player = PendingPlayer(
            player_address=player_address,
            bet_id=bet_id,
            amount=amount,
            game_type=game_type,
            joined_at=datetime.now(),
        )
        self.queue.append(player)

    def find_match(self, game_type: str) -> Optional[PendingPlayer]:
        """
        Find a match for a player of given game type.
        Returns first player of same game type (FIFO).
        """
        for i, player in enumerate(self.queue):
            if player.game_type == game_type:
                self.queue.pop(i)
                return player
        return None

    def remove_player(self, player_address: str) -> None:
        """Remove player from queue"""
        self.queue = [p for p in self.queue if p.player_address != player_address]

    def get_queue_size(self) -> int:
        """Get current queue size"""
        return len(self.queue)

    def get_queue_status(self) -> dict:
        """Get matchmaking queue status"""
        return {
            "queue_size": len(self.queue),
            "waiting_players": [
                {
                    "player": p.player_address,
                    "bet_id": p.bet_id,
                    "game_type": p.game_type,
                    "wait_time_seconds": (
                        datetime.now() - p.joined_at
                    ).total_seconds(),
                }
                for p in self.queue
            ],
        }


# Global matchmaking queue
_matchmaking_queue = None


def get_matchmaking_queue() -> MatchmakingQueue:
    """Get or create matchmaking queue (singleton)"""
    global _matchmaking_queue
    if _matchmaking_queue is None:
        _matchmaking_queue = MatchmakingQueue()
    return _matchmaking_queue
