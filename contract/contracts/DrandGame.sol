// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DrandGame
 * @notice A trustless game protocol using Drand as randomness source
 * 
 * Players deploy this contract and:
 * 1. Lock a Drand round as the randomness source
 * 2. Calculate outcomes deterministically from the Drand value
 * 3. Verify outcomes against the locked round
 * 
 * No server required. Anyone can verify any outcome against drandbeacon.io
 */

contract DrandGame {
    // Game round tracking
    struct GameRound {
        uint256 drandRound;    // Which Drand round is used
        bool locked;           // Is the round locked and immutable?
        uint256 lockedAt;      // Timestamp when locked
    }

    // gameId => GameRound
    mapping(bytes32 => GameRound) public gameRounds;

    // Events for full auditability
    event DrandRoundLocked(
        bytes32 indexed gameId,
        uint256 indexed drandRound,
        address indexed player,
        uint256 timestamp
    );

    event OutcomeCalculated(
        bytes32 indexed gameId,
        uint256 indexed drandValue,
        uint256 outcome,
        uint256 min,
        uint256 max
    );

    event OutcomeVerified(
        bytes32 indexed gameId,
        uint256 indexed drandValue,
        uint256 claimedOutcome,
        uint256 derivedOutcome,
        bool isValid
    );

    /**
     * @notice Lock a Drand round for this game
     * @param gameId Unique identifier for the game
     * @param drandRound The Drand round number to use (lookup at drandbeacon.io)
     */
    function lockDrandRound(bytes32 gameId, uint256 drandRound) external {
        require(!gameRounds[gameId].locked, "Round already locked for this game");
        require(drandRound > 0, "Invalid Drand round");

        gameRounds[gameId] = GameRound({
            drandRound: drandRound,
            locked: true,
            lockedAt: block.timestamp
        });

        emit DrandRoundLocked(gameId, drandRound, msg.sender, block.timestamp);
    }

    /**
     * @notice Calculate outcome deterministically from Drand value
     * @param drandValue The 256-bit randomness value from Drand
     * @param min Minimum value (inclusive)
     * @param max Maximum value (inclusive)
     * @return Derived outcome within [min, max]
     *
     * Formula: outcome = (drandValue % (max - min + 1)) + min
     * This ensures uniform distribution across the range
     */
    function calculateOutcome(
        uint256 drandValue,
        uint256 min,
        uint256 max
    ) external pure returns (uint256) {
        require(min <= max, "Invalid range: min must be <= max");

        uint256 range = max - min + 1;
        uint256 outcome = (drandValue % range) + min;

        return outcome;
    }

    /**
     * @notice Verify that a claimed outcome matches the Drand value
     * @param gameId The game identifier (must have locked round)
     * @param drandValue The Drand value (lookup at drandbeacon.io/round/{drandRound})
     * @param claimedOutcome The outcome being verified
     * @param min Minimum range value
     * @param max Maximum range value
     * @return True if claimed outcome is valid, false otherwise
     *
     * Anyone can verify:
     * 1. Visit drandbeacon.io/round/{gameRounds[gameId].drandRound}
     * 2. Copy the randomness value
     * 3. Call this function with claimed outcome
     * 4. If it returns true, the outcome is fair and reproducible
     */
    function verifyOutcome(
        bytes32 gameId,
        uint256 drandValue,
        uint256 claimedOutcome,
        uint256 min,
        uint256 max
    ) external view returns (bool) {
        require(gameRounds[gameId].locked, "Round not locked for this game");
        require(min <= max, "Invalid range: min must be <= max");

        uint256 range = max - min + 1;
        uint256 derivedOutcome = (drandValue % range) + min;

        return derivedOutcome == claimedOutcome;
    }

    /**
     * @notice Get the locked Drand round for a game
     * @param gameId The game identifier
     * @return drandRound The Drand round number
     * @return isLocked Lock status (true if round is locked)
     * @return timestamp When the round was locked
     */
    function getGameRound(bytes32 gameId)
        external
        view
        returns (uint256 drandRound, bool isLocked, uint256 timestamp)
    {
        GameRound storage gr = gameRounds[gameId];
        return (gr.drandRound, gr.locked, gr.lockedAt);
    }
}
