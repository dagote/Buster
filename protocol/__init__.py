"""Top-level package for the Buster protocol core components.

This package currently exposes the seed management utilities that make up
Phase 1 and 2 of the roadmap.  Future phases will add networking, game
logic, and on-chain helpers.
"""

from .seed import SeedManager, new_seed, reveal, verify

__all__ = ["SeedManager", "new_seed", "reveal", "verify"]
