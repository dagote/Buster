# Layer 1: Smart Contract

Solidity contracts deployed on Polygon (Mumbai testnet for development, mainnet for production).

## Overview

The contract is the **immutable source of truth** for Bitcino. It:
- Accepts bets from players
- Holds funds in escrow
- Validates winners sent by server
- Pays out automatically with hardcoded 2% fee

The contract does NOT contain game logic — only fund management and payment execution.

**Key Property**: Once deployed, the rules cannot change. Fee is permanently 2%, fee receiver and server wallet are permanent.

## Architecture

```
Bitcino Protocol (Open Standard)
└── Your Instance (Deployed by you)
    ├── Contract (immutable)
    ├── Server (replaceable)
    └── Frontend (replaceable)
```

## Contract Files

- `contracts/BusterGame.sol` - Main escrow and payout logic (immutable)
- `deployments/template.json` - Example deployment structure
- `deployments/your-instance.json` - Your deployment config

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure

Create `.env`:
```
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here
```

Update `deployments/your-instance.json`:

**Option A: Single Operator** (One address for both roles)
```json
{
  "feeReceiver": "0xYourWalletAddress",
  "serverWallet": "0xYourWalletAddress"
}
```

**Option B: Delegated** (Separate addresses)
```json
{
  "feeReceiver": "0xYourMainWallet",
  "serverWallet": "0xYourServerWallet"
}
```

Both patterns are supported. Choose based on your operational needs.

### 3. Test

```bash
npm test
```

### 4. Deploy

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

See [DEPLOY.md](./DEPLOY.md) for detailed deployment guide.

## Documentation

- [DEPLOY.md](./DEPLOY.md) - Step-by-step deployment guide
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Technical architecture
- [VERIFICATION.md](./VERIFICATION.md) - Requirementschecklist

## Key Design Decisions

### Immutable
- No proxy patterns
- No upgrade functions
- Rules locked at deployment

### Trustless
- No admin override
- No pause functions
- Contract enforces all rules

### Transparent
- Every transaction emitted as event
- On-chain auditable
- FeePercent hardcoded to 2%

## Deployments

### Template (For Forks)
See `deployments/template.json` - Use this structure if you fork Bitcino.

### Your Instance
Use `deployments/your-instance.json` - Fill in your addresses and deploy.

## Security

- Uses OpenZeppelin ReentrancyGuard
- Complete test coverage
- Immutable guarantees
- Hardcoded rules

## Next Steps

1. Fill out `deployments/your-instance.json`
2. Run deployment to Mumbai testnet
3. Save contract address for server/frontend
4. Test via server and frontend layers
