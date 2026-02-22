"""Utilities for generating and managing private seeds with future verifiability.

A `SeedManager` maintains a mapping between a seat identifier and a
random seed.  The seed itself stays private but a SHA‑256 commitment
is published immediately.  Later the seed can be revealed and any party
can verify the commitment matches.

This module is intentionally small in phase‑1; later phases will extend it
with persistence, on‑chain commitments, and integration with game logic.
"""

import hashlib
import secrets
from typing import Dict, Tuple


class SeedManager:
    """Simple in‑memory manager for private seeds and commitments.

    This class embodies the **entire protocol**.  No external storage or
    dependency is required – all data lives in a local dictionary while the
    process runs.  The helper functions at the bottom provide an easy
    module‑level API for quick scripts.
    """

    def __init__(self) -> None:
        # seat -> (seed_bytes, commitment_hex)
        self._seeds: Dict[str, Tuple[bytes, str]] = {}

    def create_seed(self, seat: str) -> str:
        """Generate a new seed for ``seat`` and return its commitment.

        Raises
        ------
        ValueError
            If a seed for the given seat already exists.
        """
        if seat in self._seeds:
            raise ValueError(f"seed already exists for seat {seat}")

        raw = secrets.token_bytes(32)
        commitment = hashlib.sha256(raw).hexdigest()
        self._seeds[seat] = (raw, commitment)
        return commitment

    def reveal_seed(self, seat: str) -> str:
        """Return the hex‑encoded seed previously generated for ``seat``.

        Raises
        ------
        KeyError
            If no seed for the seat exists.
        """
        if seat not in self._seeds:
            raise KeyError(f"no seed stored for seat {seat}")
        raw, _ = self._seeds[seat]
        return raw.hex()

    def verify_commitment(self, seat: str, seed_hex: str) -> bool:
        """Check that ``seed_hex`` matches the previously published commitment.

        Returns ``False`` if the seat is unknown or if the hash doesn't match.
        """
        entry = self._seeds.get(seat)
        if entry is None:
            return False
        _, commitment = entry
        computed = hashlib.sha256(bytes.fromhex(seed_hex)).hexdigest()
        return computed == commitment



# simple convenience functions for ad‑hoc use
_manager = SeedManager()

def new_seed(seat: str) -> str:
    return _manager.create_seed(seat)

def reveal(seat: str) -> str:
    return _manager.reveal_seed(seat)

def verify(seat: str, seed_hex: str) -> bool:
    return _manager.verify_commitment(seat, seed_hex)
