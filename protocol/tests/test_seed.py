"""Simple test for :mod:`protocol.seed`.

This module is intentionally plain‑vanilla so that it can run even when the
system has conflicting pytest plugins installed (a chronic problem on
this machine).  When imported by ``pytest`` the ``test_seed_lifecycle``
function will be discovered normally; when executed directly Python runs
``main()`` which uses plain asserts.  When run as a script we manually
add the repository root to ``sys.path`` so that the ``protocol`` package
can be imported.
"""

import os
import sys

# ensure the workspace root is on sys.path when executing as script
if __name__ == "__main__":
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    sys.path.insert(0, root)

from protocol.seed import SeedManager


# The test function is still usable by pytest.
def test_seed_lifecycle():
    mgr = SeedManager()
    seat = "PlayerA"

    # creating a seed returns a 64‑char hex commitment
    commitment = mgr.create_seed(seat)
    assert isinstance(commitment, str)
    assert len(commitment) == 64

    # cannot create twice for same seat
    try:
        mgr.create_seed(seat)
        raise AssertionError("expected ValueError when creating duplicate seed")
    except ValueError:
        pass

    # reveal returns the raw seed hex and verification works
    seed_hex = mgr.reveal_seed(seat)
    assert isinstance(seed_hex, str)
    assert mgr.verify_commitment(seat, seed_hex)

    # wrong seed should fail
    assert not mgr.verify_commitment(seat, "deadbeef")

    # unknown seats behave predictably
    try:
        mgr.reveal_seed("unknown")
        raise AssertionError("expected KeyError for unknown seat")
    except KeyError:
        pass
    assert not mgr.verify_commitment("unknown", seed_hex)


def main():
    """Run the tests without pytest."""
    test_seed_lifecycle()
    print("seed tests passed")


if __name__ == "__main__":
    main()
