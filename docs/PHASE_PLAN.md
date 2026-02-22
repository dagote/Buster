# New Protocol Phased Roadmap

The legacy implementation has been archived in `legacy/` and is
excluded from version control.  Going forward the repository will be
rewritten from the ground up to support a modular, verifiable random
seed protocol that can be extended with a blockchain layer later.

## Phase 0 – groundwork

1. **Archive legacy code** – everything under `legacy/` is for reference
   only and is now `.gitignore`d.
2. **Establish new directory layout** – top‑level `protocol/` holds core
   algorithmic components; an eventual `contract/`, `server/` and
   `frontend/` will be added in later phases.
3. **Starter modules & tests** – implement seed manager and unit tests.

## Phase 1 – private seed generation & commitment

* Build a service (initially in Python) that generates a cryptographically
  secure random seed per game/seat.  Seeds are kept secret but a SHA‑256
  commitment is returned immediately.
* Provide API or CLI interface for creating seeds, revealing them, and
  verifying commitments.  (See `protocol/seed.py`.)
* Write thorough unit tests; run them on every commit.

## Phase 2 – minimal persistence draft (optional)

* The protocol continues to work fully in memory; no storage is required.
  Early exploration of persistence revealed that most applications don't
  actually need it for protocol correctness, so the reference library only
  contains the core seeding logic.
* If an operator **does** want durable logs or audit trails they may
  implement their own storage layer; the API is simple enough that a
  few lines of code suffices.  We provide no built-in backend.
* Keep phase 2 task list light: emphasize the core remains in memory
  and that any persistence or audit trail is the responsibility of the
  host application.  The example test suite continues to focus on the
  seed lifecycle.

## Phase 3 – blockchain commitment layer (Polygon mainnet target)

This phase is now **complete**. The reference contract and associated
tooling have been implemented, tested, and documented. It serves as a
public anchor to which servers must commit their seed+formula blob
before play, preventing any retro‑active changes to the calculation
that produced an outcome.

* **Contract**: `contract/contracts/SeedCommit.sol` stores a
  `bytes32` anchor per `gameId` (`anchor = keccak256(seed||formula||params)`).
  It emits an `Anchored` event and exposes a `verify` view helper.  The
  contract contains no game logic and imposes no gas burden beyond the
  anchor storage itself.
* **Hardhat project** with minimal dependencies compiles and tests the
  contract (see `contract/test/SeedCommit.test.js`) and includes a simple
  deployment script in `contract/scripts/deploy.js`.
* **Deployment guidance** is in `contract/README.md`; environment
  variables configure RPC URL and private key.  Deployment to Polygon
  mainnet is encouraged but not required; the contract is chain‑agnostic.
* **Genericity**: since the anchor can incorporate any bytes, the same
  contract supports dice, cards, MMOs, or future game types without
  modification.

### residual items

1. **Deploy the contract to a live chain** (e.g. Polygon mainnet or
   Mumbai testnet).  Once deployed, record the address in the project
   documentation (see `/docs/CONTRACT_ADDRESS.md` or similar).  This
   provides a concrete reference that clients can use when testing the
   protocol publicly.  Until such a deployment exists, docs may show a
   placeholder address and a note explaining how to perform the
   deployment.
2. Add SDK wrappers or CLI helpers as Phase 4 tooling grows.
3. Optionally experiment with off‑chain commit anchors (gzip + IPFS,
   Drand log) if users want zero‑fee alternatives.

## Phase 4 – deterministic game logic & public verification

* Define the outcome function: `outcome = H(seed || public_randomness)`.
  Public randomness may come from Drand, Chainlink VRF, an oracle, etc.
  (See `docs/DETERMINISTIC_MATH.md` for general formulae and examples.)
* Implement game modules that consume seeds and randomness to compute
  results.  Produce tooling (CLI, frontend) that allows anyone to verify
  a given game's outcome by recomputing it from the seed and the known
  randomness input.
* Write integration tests covering full flow from commitment through
  reveal and verification.

## Phase 5 – user interfaces & deployment

* Rebuild the server and frontend around the new core modules.  These
  components will be lightweight and only responsible for matchmaking,
  payment handling, and seed coordination.
* Document the deployment process for protocol users; emphasise that
  each deployment is a standalone instance with its own wallets.
* Launch a reference implementation on a testnet, then mainnet once
  security audits are complete.

## Phase 6 – future enhancements

* Add support for multi‑seat games, committees, and advanced betting
  mechanics.  *Consider* cryptographic primitives such as threshold
  randomness or verifiable delay functions when the protocol grows.
* Open the repository to contributors; maintain the protocol as an open
  source, forkable template rather than a single centralized service.

> **Note:** each phase should be accompanied by documentation, tests,
> and a small demo to exercise the new functionality.  Progress will be
> tracked in issues or project boards as needed.
