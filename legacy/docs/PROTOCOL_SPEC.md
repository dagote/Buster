# Buster Protocol Specification

## Overview

Buster is a decentralized, open-source protocol for P2P betting on any EVM-compatible blockchain.

## Key Properties

### Trustless

- Players' funds held exclusively by smart contract
- Server cannot access or touch funds
- All payouts determined by on-chain contract logic

### Open

- Fully open-source, MIT licensed
- Anyone can deploy the contract independently
- Anyone can run their own server instance
- Anyone can build their own frontend

### Incentive-Aligned

- Protocol deployer receives 1% of every settled bet
- Incentive grows with user activity
- No subscription fees or licenses

### Replaceable

- **Contract**: Canonical truth; when deployed, becomes the protocol spec
- **Server**: Can be swapped for alternative implementation without breaking protocol
- **Frontend**: Can be redesigned without affecting protocol

## Betting Flow

1. **Initiation**: Player A places bet via frontend
   - Approves MATIC spend on contract
   - Contract receives funds, enters escrow state

2. **Matchmaking**: Server finds Player B
   - Notifies both players via API

3. **Game**: Server runs game code
   - Dice rolls, match-3 logic, etc.
   - Server generates cryptographically secure random outcomes
   - Game state stored server-side (not on-chain)

4. **Settlement**: Server calls contract with winner
   - Contract validates signature
   - Transfers winner's share + 1% fee
   - Event emitted for transparency

5. **Payout**: Frontend displays result
   - User can withdraw accumulated winnings

## Contract Guarantee

**Once deployed, the contract is immutable to the protocol. It defines the rules for all time.**

Key contract guarantees:
- Funds transferred only to winner address
- 1% fee split is non-negotiable
- No way to claw back or pause bets mid-game
- All transactions auditable on-chain

## Server Trust Model

The server is **NOT trusted with funds**. It can:
- ✅ Decide game outcomes
- ✅ Match players
- ✅ Set payoff rates (as long as they match contract)
- ❌ Touch player funds
- ❌ Cancel ongoing bets

**Alternative servers can be spun up that differ in:**
- Game types offered
- Matchmaking algorithms
- UI/UX design
- Fee-sharing models (but only if contract allows)

## Economic Model

```
100 MATIC bet placed
    ↓
50 MATIC to winner (if they win)
50 MATIC to loser (stays there)
```

For settled 100 MATIC bet:
- 99 MATIC to winner
- 1 MATIC to deployer
- 0 MATIC to server (paid from deployer's 1%)

## Deployability

minimum requirements to redeploy Buster completely:
1. Deployer address (gets 1% fee)
2. Polygon RPC endpoint
3. Testnet MATIC
4. Private key
5. Python environment
6. Node.js environment
7. ~30 minutes

Result: Fully independent instance of Buster under new deployer control.

## Governance

There is no governance DAO or upgradeable contract. Each deployed instance is final and immutable. Changes would require:
1. New contract deployment
2. Migration to new contract
3. Community consensus to switch (if multiple instances exist)

This locks in the rules and prevents arbitrary changes.

---

**Last Updated**: Feb 2026
