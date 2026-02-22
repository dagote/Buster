# Layer 3: Frontend

React application for the Bitcino protocol. This is an example implementation — operators can build their own frontend.

## Overview

A simple, player-friendly interface for:
- Connecting to MetaMask
- Placing bets
- Playing the dice game
- Viewing results and payouts

## Architecture

```
src/
├── components/      # React components
│   └── DiceGame/    # Game board UI
├── pages/           # Page layouts
├── services/        # API & Web3 integrations
├── hooks/           # Custom React hooks
└── utils/           # Helper functions
```

## Setup

```bash
npm install
```

## Configuration

Create `.env.local`:
```
REACT_APP_SERVER_URL=http://localhost:8000
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_NETWORK_ID=80001  # Mumbai testnet
```

## Running

```bash
npm start
```

App will open on `http://localhost:3000`

## MetaMask Setup

1. Install MetaMask extension
2. Create or import wallet
3. Add Polygon Mumbai network:
   - RPC: https://rpc-mumbai.maticvigil.com
   - Chain ID: 80001
   - Currency: MATIC
4. Get testnet MATIC from faucet

## Build for Production

```bash
npm run build
```

Static files in `build/` ready to deploy.

## Customization

- Change game type by modifying `DiceGame` component
- Update styling in component CSS files
- Add additional game modes in `services/gameService.js`

## Next Steps

1. Implement real-time WebSocket updates from server
2. Add animations and better UX
3. Mobile-responsive design
4. Analytics integration
