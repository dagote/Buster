# Buster Protocol Core

This package forms the core of the **Buster protocol**: a minimal
system for producing private, verifiable seeds that downstream components
(game servers, clients, or smart contracts) can use to deterministically
compute game outcomes.

The core API is intentionally small and has **no external dependencies**
– it works purely in memory.  Persistence, logging, or any other
operational concerns are entirely optional extras that consumers may add
if they find them useful.  The reference implementation contains only
the protocol logic; no storage helpers are included by default.

The repository is structured to make "protocol-first" development easy:

```
/contract   # future smart-contracts (Solidity, etc.)
/protocol   # core libraries and reference implementation (this package)
/server     # future backend examples (Python, JavaScript, ...)
/frontend   # future UI examples (React, etc.)
/docs       # architecture, API specs, phase plans
/legacy     # archived previous implementation (ignored by git)
```

## Quick start

1. Clone the repo and install dependencies (Python 3.11+):

   ```powershell
   git clone <repo-url>
   cd bitcino
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt   # later; currently only stdlib used
   ```

2. Run the unit tests for the seed manager:

   ```powershell
   python protocol/tests/test_seed.py
   ```

3. Explore the API from within Python:

   ```python
   >>> from protocol import SeedManager
   >>> mgr = SeedManager()
   >>> c = mgr.create_seed("alice")
   >>> print("commitment", c)
   >>> s = mgr.reveal_seed("alice")
   >>> print("raw seed", s)
   >>> mgr.verify_commitment("alice", s)
   True
   ```

   (Persistence is an optional concern developers can implement
as needed; the core API itself is purely in‑memory.)

4. See ``protocol/example.py`` for a complete script demonstrating a
   simple session.

## Using the protocol in your own project

- Import the package from the repository (or install it via `pip` once
  it’s published).
- Generate a pre-game commitment with ``SeedManager.create_seed`` and
  publish the returned hash to opponents, the blockchain, or wherever your
  protocol requires.
- After the game you may ``reveal_seed`` and allow anyone to call
  ``verify_commitment``; this ensures fairness while the original seed
  remained private.

### Future directions

Once the core library stabilizes we expect to publish language bindings or
Docker images that make it trivial to plug into game servers or clients.
At Phase 3 we'll add on‑chain commitment helpers and networked API
examples under `/server` and `/frontend`.

documentation lives in `/docs` and the high-level roadmap is in
`docs/PHASE_PLAN.md`.
