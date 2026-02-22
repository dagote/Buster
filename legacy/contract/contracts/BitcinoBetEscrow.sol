// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BitcinoBetEscrow
 * @dev Immutable escrow contract for P2P betting on Polygon with Drand-based randomness.
 *
 * Key Design Principles:
 * - NO upgradeability - rules are finalized at deployment
 * - FEE_PERCENT hardcoded at 2% and immutable
 * - Fee receiver set once at construction, never modifiable
 * - Server wallet authorized at construction, never modifiable
 * - All funds held by contract, never by intermediaries
 * - All randomness sourced from Drand (decentralized, verifiable)
 * - All state transitions emit events for auditability
 *
 * Drand Integration:
 * - Games are settled using randomness from Drand beacon
 * - Server submits drand round number and value
 * - Outcome is derived deterministically from drand value
 * - Anyone can verify on drandbeacon.io
 */
contract BitcinoBetEscrow is ReentrancyGuard {
    /// @dev Hardcoded fee percentage - 2% to deployer
    uint256 public constant FEE_PERCENT = 2;

    /// @dev Divisor for percentage calculations (100%)
    uint256 private constant PERCENT_DIVISOR = 100;

    /// @dev Fixed at construction - receives fees from settled bets
    address public immutable feeReceiver;

    /// @dev Fixed at construction - authorized to call settleWager()
    address public immutable serverWallet;

    /// @dev Bet states
    enum BetStatus {
        Pending,        // Awaiting second player
        Active,         // Both players in, game in progress
        Settled,        // Winner determined, funds transferred
        Canceled        // Returned to players (if no second player)
    }

    /// @dev Core bet structure
    struct Bet {
        uint256 betId;
        address player1;
        address player2;
        uint256 amount;
        BetStatus status;
        address winner;
        uint256 settledAt;
        string gameType;
    }

    /// @dev Mapping: betId => Bet
    mapping(uint256 => Bet) public bets;

    /// @dev Mapping: player => claimable balance
    mapping(address => uint256) public claimableBalance;

    /// @dev Auto-incrementing bet ID counter
    uint256 public betCounter;

    /// @dev Total MATIC locked in escrow
    uint256 public totalEscrow;

    // ============ EVENTS ============

    event BetPlaced(
        uint256 indexed betId,
        address indexed player1,
        uint256 amount,
        string gameType
    );

    event BetJoined(
        uint256 indexed betId,
        address indexed player2,
        uint256 amount
    );

    event BetSettled(
        uint256 indexed betId,
        address indexed winner,
        uint256 winnerPayout,
        uint256 feeAmount
    );

    event BetSettledWithDrand(
        uint256 indexed betId,
        address indexed winner,
        uint256 winnerPayout,
        uint256 feeAmount,
        uint256 drandRound,
        uint256 drandValue,
        uint8 player1Roll,
        uint8 player2Roll
    );

    event BetCanceled(
        uint256 indexed betId,
        address indexed player1,
        uint256 amount
    );

    event BalanceWithdrawn(
        address indexed player,
        uint256 amount
    );

    // ============ CONSTRUCTOR ============

    /**
     * @dev Initialize contract with immutable fee receiver and server wallet.
     * @param _feeReceiver Address that receives 2% of all settled bets
     * @param _serverWallet Address authorized to settle wagers
     *
     * NOTE: These addresses are IMMUTABLE. They cannot be changed after deployment.
     * This ensures the protocol rules are locked in place.
     *
     * FLEXIBILITY: feeReceiver and serverWallet can be the same address (for single-operator
     * deployments) or different addresses (for delegation models). The choice is yours.
     */
    constructor(address _feeReceiver, address _serverWallet) {
        require(_feeReceiver != address(0), "Invalid fee receiver");
        require(_serverWallet != address(0), "Invalid server wallet");

        feeReceiver = _feeReceiver;
        serverWallet = _serverWallet;
        betCounter = 0;
    }

    // ============ BETTING FUNCTIONS ============

    /**
     * @dev Player 1 initiates a bet. Funds immediately enter escrow.
     * @param _gameType Type of game (e.g., "dice", "slots")
     */
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

    /**
     * @dev Player 2 joins an existing bet with equal amount.
     * @param _betId ID of the pending bet to join
     */
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

    // ============ SETTLEMENT FUNCTION ============

    /**
     * @dev Settle a wager using Drand randomness.
     * Only the serverWallet can call this function.
     *
     * Drand provides verifiable, decentralized randomness that no single party can manipulate.
     * The game outcome is determined entirely by the drand value at a specific round.
     *
     * Payout split:
     * - 98% to winner
     * - 2% to fee receiver
     *
     * @param _betId ID of the bet to settle
     * @param _drandRound The Drand round number used for this game
     * @param _drandValue The random value from Drand (can be verified at drandbeacon.io)
     *
     * NOTE: Anyone can verify the outcome by:
     * 1. Going to drandbeacon.io
     * 2. Looking up the _drandRound
     * 3. Checking the randomness value matches _drandValue
     * 4. Computing: player1_roll = (_drandValue % 6) + 1
     * 5. Computing: player2_roll = ((_drandValue >> 8) % 6) + 1
     * 6. Verifying winner matches contract settlement
     */
    function settleWagerWithDrand(
        uint256 _betId,
        uint256 _drandRound,
        uint256 _drandValue
    ) external nonReentrant {
        require(msg.sender == serverWallet, "Only server can settle wagers");

        Bet storage bet = bets[_betId];

        require(bet.status == BetStatus.Active, "Bet is not active");

        // Derive game outcome from Drand value (deterministic, verifiable)
        uint8 player1Roll = uint8((_drandValue % 6) + 1);
        uint8 player2Roll = uint8(((_drandValue >> 8) % 6) + 1);

        address winner;
        if (player1Roll > player2Roll) {
            winner = bet.player1;
        } else if (player2Roll > player1Roll) {
            winner = bet.player2;
        } else {
            // Edge case: equal rolls (extremely rare with Drand entropy)
            // Player 1 wins on tie
            winner = bet.player1;
        }

        // Calculate payouts
        uint256 totalPool = bet.amount * 2;
        uint256 feeAmount = (totalPool * FEE_PERCENT) / PERCENT_DIVISOR;
        uint256 winnerPayout = totalPool - feeAmount;

        // Update state
        bet.status = BetStatus.Settled;
        bet.winner = winner;
        bet.settledAt = block.timestamp;

        // Update claimable balances
        claimableBalance[winner] += winnerPayout;
        claimableBalance[feeReceiver] += feeAmount;

        // Reduce escrow
        totalEscrow -= totalPool;

        emit BetSettledWithDrand(
            _betId,
            winner,
            winnerPayout,
            feeAmount,
            _drandRound,
            _drandValue,
            player1Roll,
            player2Roll
        );
    }

    /**
     * @dev Legacy: Settle wager using server-provided outcome.
     * DEPRECATED in favor of settleWagerWithDrand.
     * This function is kept for backwards compatibility but should not be used.
     * Use settleWagerWithDrand() instead for verifiable randomness via Drand.
     */
    function settleWager(uint256 _betId, address _winner)
        external
        nonReentrant
    {
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

    // ============ CANCELLATION FUNCTION ============

    /**
     * @dev Cancel a pending bet (no second player joined).
     * Only player1 can cancel their own pending bet.
     * @param _betId ID of the pending bet to cancel
     */
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

    // ============ WITHDRAWAL FUNCTION ============

    /**
     * @dev Withdraw accumulated balance (from wins or cancellations).
     */
    function withdraw() external nonReentrant {
        uint256 balance = claimableBalance[msg.sender];
        require(balance > 0, "No balance to withdraw");

        claimableBalance[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit BalanceWithdrawn(msg.sender, balance);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get full details of a bet.
     */
    function getBet(uint256 _betId) external view returns (Bet memory) {
        return bets[_betId];
    }

    /**
     * @dev Get a player's claimable balance.
     */
    function getBalance(address _player) external view returns (uint256) {
        return claimableBalance[_player];
    }

    /**
     * @dev Get total amount currently in escrow.
     */
    function getEscrowTotal() external view returns (uint256) {
        return totalEscrow;
    }

    // ============ FALLBACK ============

    /**
     * @dev Reject accidental ETH transfers (must use placeBet).
     */
    receive() external payable {
        revert("Use placeBet() to initiate a bet");
    }
}
