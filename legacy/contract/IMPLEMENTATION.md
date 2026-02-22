# BusterGame Contract Documentation

## Overview

`BusterGame.sol` is the core smart contract for the Buster Protocol. It is **immutable**, **trustless**, and **transparent**.

- **Network**: Polygon (Mumbai testnet, Mainnet production)
- **Language**: Solidity `^0.8.24`
- **Lines of Code**: ~400 (minimal, auditable)
- **External Dependencies**: OpenZeppelin ReentrancyGuard

---

## Key Properties

### 1. Immutable Rules

Once deployed, the contract rules **cannot change**:
- Fee is always 2%
- Fee receiver is fixed
- Server wallet is fixed
- Payout logic is fixed

There are **zero admin functions** that could modify these rules.

### 2. Trustless Fund Management

- Players' funds held exclusively by the contract
- Server cannot access or hold funds
- Only the contract can release funds
- All state transitions are on-chain and auditable

### 3. Transparent

Every state change emits an event:
- `BetPlaced`
- `BetJoined`
- `BetSettled`
- `BetCanceled`
- `BalanceWithdrawn`

These events can be indexed and queried by off-chain systems.

---

## Data Structures

### BetStatus Enum

```solidity
enum BetStatus {
    Pending,        // 0: Awaiting second player
    Active,         // 1: Both players in, game in progress
    Settled,        // 2: Winner determined, funds transferred
    Canceled        // 3: Returned to players
}
```

### Bet Struct

```solidity
struct Bet {
    uint256 betId;          // Unique identifier
    address player1;        // First player (initiator)
    address player2;        // Second player (joiner)
    uint256 amount;         // Amount each player bet
    BetStatus status;       // Current state
    address winner;         // Winning player (if settled)
    uint256 settledAt;      // Timestamp of settlement
    string gameType;        // Type of game (e.g., "dice")
}
```

### Storage

```solidity
mapping(uint256 => Bet) public bets;              // All bets by ID
mapping(address => uint256) public claimableBalance;  // Winnings to withdraw
uint256 public totalEscrow;                       // Total funds locked
uint256 public betCounter;                        // Auto-incrementing ID
```

---

## Functions

### Initialization

#### `constructor(address _feeReceiver, address _serverWallet)`

```solidity
constructor(address _feeReceiver, address _serverWallet) {
    require(_feeReceiver != address(0), "Invalid fee receiver");
    require(_serverWallet != address(0), "Invalid server wallet");
    
    feeReceiver = _feeReceiver;
    serverWallet = _serverWallet;
    betCounter = 0;
}
```

**Responsibility**: Set immutable protocol parameters
- `feeReceiver`: Receives 2% of all settled bets
- `serverWallet`: Authorized to call `settleWager()`

**Immutability**: Both are declared `immutable` and cannot change.

**Flexibility**: You can use the same address for both roles (single operator) or different addresses (delegated operations):

**Pattern 1: Single Operator**
```
feeReceiver = 0x123...  (your wallet)
serverWallet = 0x123... (same wallet)
```
Simple, one address controls everything.

**Pattern 2: Delegated**
```
feeReceiver = 0x123...  (your main wallet, receives 2%)
serverWallet = 0x456... (your server/house account, settles bets)
```
Separates business (fees) from operations (game settling).

**Validation**:
- Neither address can be zero
- Both must be valid addresses
- Can be the same or different (your choice)

```solidity
function placeBet(string memory _gameType) external payable nonReentrant {
    require(msg.value > 0, "Bet amount must be greater than 0");
    require(bytes(_gameType).length > 0, "Game type required");
    
    betCounter++;
    uint256 _betId = betCounter;
    
    bets[_betId] = Bet({
        betId: _betId,
        player1: msg.sender,
        player2: address(0),
        amount: msg.value,
        status: BetStatus.Pending,
        winner: address(0),
        settledAt: 0,
        gameType: _gameType
    });
    
    totalEscrow += msg.value;
    emit BetPlaced(_betId, msg.sender, msg.value, _gameType);
}
```

**Role**: Initiated by Player 1

**Flow**:
1. Player 1 sends MATIC (amount to bet)
2. Contract creates a new `Bet` with status `Pending`
3. Funds immediately enter escrow (`totalEscrow`)
4. Returns `betId` for Player 2 to join

**Requirements**:
- Bet amount > 0
- Game type specified (non-empty string)

**Events**:
- `BetPlaced(betId, player1, amount, gameType)`

---

#### `joinBet(uint256 _betId) external payable`

```solidity
function joinBet(uint256 _betId) external payable nonReentrant {
    Bet storage bet = bets[_betId];
    
    require(bet.status == BetStatus.Pending, "Bet is not pending");
    require(msg.value == bet.amount, "Must match bet amount exactly");
    require(msg.sender != bet.player1, "Cannot play against yourself");
    
    bet.player2 = msg.sender;
    bet.status = BetStatus.Active;
    totalEscrow += msg.value;
    
    emit BetJoined(_betId, msg.sender, msg.value);
}
```

**Role**: Initiated by Player 2

**Flow**:
1. Player 2 sends MATIC (exact amount as Player 1)
2. Contract sets `player2` and changes status to `Active`
3. Total pool now = 2 × bet amount
4. Game can begin

**Requirements**:
- Bet must be `Pending` (no one else has joined)
- Exact amount match to Player 1's bet
- Player cannot join their own bet

**Events**:
- `BetJoined(betId, player2, amount)`

---

### Settlement Phase

#### `settleWager(uint256 _betId, address _winner) external nonReentrant`

```solidity
function settleWager(uint256 _betId, address _winner) external nonReentrant {
    require(msg.sender == serverWallet, "Only server can settle wagers");
    
    Bet storage bet = bets[_betId];
    
    require(bet.status == BetStatus.Active, "Bet is not active");
    require(
        _winner == bet.player1 || _winner == bet.player2,
        "Winner must be one of the players"
    );
    
    // Calculate payouts
    uint256 totalPool = bet.amount * 2;
    uint256 feeAmount = (totalPool * FEE_PERCENT) / PERCENT_DIVISOR;
    uint256 winnerPayout = totalPool - feeAmount;
    
    // Update state
    bet.status = BetStatus.Settled;
    bet.winner = _winner;
    bet.settledAt = block.timestamp;
    
    // Update claimable balances
    claimableBalance[_winner] += winnerPayout;
    claimableBalance[feeReceiver] += feeAmount;
    
    // Reduce escrow
    totalEscrow -= totalPool;
    
    emit BetSettled(_betId, _winner, winnerPayout, feeAmount);
}
```

**Role**: Called exclusively by server

**Flow**:
1. Server determines game outcome
2. Server calls `settleWager()` with winner address
3. Contract calculates payouts:
   - Total pool = both bets
   - Fee = pool × 2 / 100 = 2% of pool
   - Winner = pool - fee = 98% of pool
4. Updates `claimableBalance` for withdrawal
5. Reduces `totalEscrow` (funds "claimed" but not yet withdrawn)

**Access Control**:
- Only `serverWallet` can call this
- Winner must be Player 1 or Player 2

**Payout Logic**:
```
Example: Each player bets 100 MATIC
  Total Pool = 200 MATIC
  Fee (2%) = 4 MATIC
  Winner Payout = 196 MATIC
  Fee Receiver Gets = 4 MATIC
```

**Events**:
- `BetSettled(betId, winner, winnerPayout, feeAmount)`

---

#### `cancelBet(uint256 _betId) external nonReentrant`

```solidity
function cancelBet(uint256 _betId) external nonReentrant {
    Bet storage bet = bets[_betId];
    
    require(bet.status == BetStatus.Pending, "Only pending bets can be canceled");
    require(msg.sender == bet.player1, "Only player1 can cancel");
    
    uint256 amount = bet.amount;
    
    bet.status = BetStatus.Canceled;
    totalEscrow -= amount;
    claimableBalance[msg.sender] += amount;
    
    emit BetCanceled(_betId, msg.sender, amount);
}
```

**Role**: Called by Player 1 if no one has joined

**Flow**:
1. Player 1 changed mind and cancels
2. Bet must still be `Pending`
3. Funds returned to Player 1's `claimableBalance`
4. Bet marked as `Canceled`

**Requirements**:
- Bet must be `Pending`
- Only Player 1 can cancel

**Events**:
- `BetCanceled(betId, player1, amount)`

---

### Withdrawal Phase

#### `withdraw() external nonReentrant`

```solidity
function withdraw() external nonReentrant {
    uint256 balance = claimableBalance[msg.sender];
    require(balance > 0, "No balance to withdraw");
    
    claimableBalance[msg.sender] = 0;
    
    (bool success, ) = payable(msg.sender).call{value: balance}("");
    require(success, "Withdrawal failed");
    
    emit BalanceWithdrawn(msg.sender, balance);
}
```

**Role**: Called by winner or fee receiver to claim funds

**Flow**:
1. Player checks their `claimableBalance`
2. Calls `withdraw()`
3. Contract transfers MATIC to their address
4. Balance zeroed out (prevents double-withdrawal)

**Safety**:
- Uses `nonReentrant` guard
- Checks balance before transfer
- Zeroes balance before transfer (avoid reentrancy)
- Low-level `call` allows any address to receive funds

**Events**:
- `BalanceWithdrawn(player, amount)`

---

### Query Functions

All view functions (read-only, no gas cost):

#### `getBet(uint256 _betId) → Bet`
Returns full bet details.

#### `getBalance(address _player) → uint256`
Returns claimable balance for an address.

#### `getEscrowTotal() → uint256`
Returns total MATIC currently locked in escrow.

---

## Events

### BetPlaced
```solidity
event BetPlaced(
    uint256 indexed betId,
    address indexed player1,
    uint256 amount,
    string gameType
);
```
Emitted when Player 1 initiates a bet.

### BetJoined
```solidity
event BetJoined(
    uint256 indexed betId,
    address indexed player2,
    uint256 amount
);
```
Emitted when Player 2 joins.

### BetSettled
```solidity
event BetSettled(
    uint256 indexed betId,
    address indexed winner,
    uint256 winnerPayout,
    uint256 feeAmount
);
```
Emitted when server determines winner.

### BetCanceled
```solidity
event BetCanceled(
    uint256 indexed betId,
    address indexed player1,
    uint256 amount
);
```
Emitted when Player 1 cancels pending bet.

### BalanceWithdrawn
```solidity
event BalanceWithdrawn(
    address indexed player,
    uint256 amount
);
```
Emitted when someone withdraws their balance.

---

## Gas Optimization

The contract is optimized for reasonable gas costs:

1. **Minimal storage**: Only essentials stored on-chain
2. **Efficient mapping lookups**: O(1) for bet retrieval
3. **Batch operations**: Settlement updates both balances in one transaction
4. **No external calls**: Except final withdrawal
5. **No loops**: All operations O(1) time complexity

---

## Security Considerations

### Reentrancy
- Uses OpenZeppelin `ReentrancyGuard` on all state-modifying functions
- Balances zeroed before withdrawal (check-effects-interactions pattern)

### Integer Overflow
- Solidity 0.8.24+ includes automatic overflow checks
- Fee calculation: `(totalPool * 2) / 100` is safe

### Access Control
- Only `serverWallet` can settle bets
- Only `player1` can cancel their own bet
- Only bet participants can receive payouts

### Input Validation
- All addresses validated (non-zero)
- All amounts validated (> 0)
- Bet status transitions validated
- Player eligibility verified

---

## Deployment Checklist

- [ ] Get two different addresses:
  - One for `feeReceiver` (receives 2% of bets)
  - One for `serverWallet` (authorized to settle)
- [ ] Fund deployer account with testnet MATIC
- [ ] Run: `npx hardhat run scripts/deploy.js --network mumbai`
- [ ] Save contract address
- [ ] Verify on PolygonScan (optional)
- [ ] Add address to server `.env`
- [ ] Add address to frontend `.env.local`
- [ ] Run test suite: `npm test`

---

## Example Usage

### Scenario: Alice vs Bob, Alice wins

1. **Alice places bet**
   ```
   Alice sends 1 MATIC via placeBet("dice")
   → betId = 1 created, status = Pending
   → totalEscrow = 1 MATIC
   ```

2. **Bob joins bet**
   ```
   Bob sends 1 MATIC via joinBet(1)
   → status changes to Active
   → totalEscrow = 2 MATIC
   ```

3. **Server plays game**
   ```
   Server runs dice game logic
   Alice rolls higher than Bob
   Alice determined as winner
   ```

4. **Server settles bet**
   ```
   Server calls settleWager(1, Alice.address)
   
   Calculations:
     totalPool = 2 MATIC
     fee = 2 * 2 / 100 = 0.04 MATIC
     winnerPayout = 2 - 0.04 = 1.96 MATIC
   
   Updates:
     claimableBalance[Alice] += 1.96
     claimableBalance[feeReceiver] += 0.04
     totalEscrow = 0
   ```

5. **Alice and fee receiver withdraw**
   ```
   Alice calls withdraw()
     → Receives 1.96 MATIC
   
   feeReceiver calls withdraw()
     → Receives 0.04 MATIC
   ```

---

## Future Considerations

- **Batch settlement**: Multiple bets settled in one transaction
- **Dispute resolution**: (if manual server fails)
- **ERC-20 tokens**: Support for other stablecoins (USDC, USDT)
- **Multi-game support**: Different fee splits per game type

However, these would require **new contract deployment**, not upgrades.
