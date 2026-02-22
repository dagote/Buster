# Buster API Specification

REST API for Buster server.

## Base URL

`http://localhost:8000`

## Endpoints

### Betting

**POST** `/bet/place`

Player initiates a bet.

Request:
```json
{
  "playerAddress": "0x...",
  "amount": 100,
  "gameType": "dice"
}
```

Response:
```json
{
  "wagerID": "uuid",
  "status": "pending_opponent",
  "createdAt": "2026-02-21T10:00:00Z"
}
```

### Game

**GET** `/game/{wagerID}`

Get current game state.

Response:
```json
{
  "wagerID": "uuid",
  "player1": "0x...",
  "player2": "0x...",
  "amount": 100,
  "status": "in_progress",
  "rolls": [4, 2],
  "currentTurn": "0x..."
}
```

**POST** `/game/{wagerID}/action`

Submit a game action (dice roll, etc).

Request:
```json
{
  "playerAddress": "0x...",
  "action": "roll",
  "nonce": 1
}
```

Response:
```json
{
  "result": 5,
  "message": "Awaiting opponent action"
}
```

### Player

**GET** `/player/{address}`

Get player statistics.

Response:
```json
{
  "address": "0x...",
  "totalBets": 50,
  "totalWins": 28,
  "totalLosses": 22,
  "winRate": 0.56,
  "totalVolume": "5000.00"
}
```

## Status Codes

- `200`: Success
- `400`: Bad request
- `404`: Not found
- `500`: Server error

## Authentication

Server validates all requests use a signed message from their wallet.

---

More endpoints to be documented as features are built.
