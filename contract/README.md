# Contract Suite (Phase 3)

This directory contains the minimal smart contract and tests required for
Phase 3 of the protocol roadmap.  The goal is **not** to implement game
logic on‑chain but simply to provide a canonical, tamper‑evident place to
record seed commitments.

## Overview

- `contracts/SeedCommit.sol` – the core contract.  It maps a generic
  `bytes32 gameId` to a `bytes32 commitment` and emits an event when a
  commitment is made.  A helper view method lets callers verify a raw
  seed against the stored hash.

- `test/SeedCommit.test.js` – Hardhat tests that exercise the basic
  functionality (commitment recording, duplicate prevention, verification).

- `hardhat.config.js` – configuration targeting Polygon testnet (`amoy`)
  and mainnet, plus compiler settings from the legacy project.

## Getting started

1. Install dependencies:
   ```powershell
   cd contract
   npm install
   ```
2. Compile the contract:
   ```powershell
   npx hardhat compile
   ```
3. Run the tests:
   ```powershell
   npx hardhat test
   ```
4. To deploy to Polygon mainnet or a testnet, set environment variables
   in a `.env` file:
   ```ini
   POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com
   PRIVATE_KEY=<your deployer key>
   POLYGONSCAN_API_KEY=<api key for verification>
   ```
   Then run:
   ```powershell
   npx hardhat run --network polygon scripts/deploy.js
   ```

   (A simple deployment script is provided in `scripts/deploy.js`.)

5. **Demo anchor flow** – to exercise the full sequence of anchoring
   and verifying on-chain, you can run the demonstration script:
   ```powershell
   npx hardhat run scripts/demo.js --network localhost   # local hardhat
   npx hardhat run scripts/demo.js --network amoy       # Polygon Mumbai
   ```
   This script deploys the contract, computes an anchor from
   `seed||formula`, commits it, and then immediately performs an
   on-chain verification showing the revealed blob matches the stored
   anchor.  Example output from a local run:
   ```text
   Using deployer 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   SeedCommit deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3
   Computed anchor 0x5cab34243706404e833b93ec2a38cfa7b63279277f6bbdcb20713f6760e347c2
   Anchor committed for gameId 0x269104906677809c12883e27611245bf50149137784511158587e8f5c8133e08
   On-chain verification of revealed blob: true
   ```
   Use this to prove the protocol works end‑to‑end before connecting real game logic.

After you deploy the contract to a public network, add its address to
`docs/CONTRACT_ADDRESS.md` and run this demo against that network to
verify the public contract is functioning correctly.
## Why Polygon?
The protocol historically ran on Polygon and the existing infrastructure
in `legacy/contract` already targets that chain.  For continuity we
continue to use Polygon mainnet for public commitments; nothing about the
contract ties it exclusively to Polygon, so it may be deployed anywhere
equipped with an EVM.
