# Buster Protocol

A decentralized P2P betting protocol on Polygon. Open source, forkable, and deployable by anyone.

## Quick Start

```bash
# Clone and setup all layers
git clone <repo>
cd bitcino

# See full instructions
cat QUICK_START.md
```

## 3-Layer Architecture

| Layer | Purpose | Tech |
|-------|---------|------|
| [Contract](./contract) | Smart contract escrow & payouts | Solidity + Hardhat |
| [Server](./server) | Game logic & matchmaking | Python + FastAPI |
| [Frontend](./frontend) | Player experience | React + Web3.js |

## Protocol Principles

- **Trustless**: Funds held by contract, not operator
- **Open**: Anyone can fork and deploy
- **Incentivized**: Deployer takes 1% of every bet
- **Replaceable**: Server and frontend can be swapped out
- **Auditable**: All transactions on-chain

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [API Specification](./docs/API_SPEC.md)
- [Protocol Spec](./docs/PROTOCOL_SPEC.md)

## License

Open Source
