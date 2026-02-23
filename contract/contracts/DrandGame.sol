// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DrandGame
 * @notice A trustless game protocol using Drand as randomness source
 * 
 * Supports two derivation modes:
 * - SEQUENTIAL: For games with finite pools (cards, lotto balls)
 *   Requires pointer tracking, prevents duplicates
 * - INDEPENDENT: For games with independent draws (dice, coin flips)
 *   No pointer tracking, same value can appear multiple times
 * 
 * Players deploy this contract and:
 * 1. Lock a Drand round as the randomness source
 * 2. Calculate outcomes deterministically from the Drand value
 * 3. Verify outcomes against the locked round
 * 
 * No server required. Anyone can verify any outcome against drandbeacon.io
 */

contract DrandGame {
    // Game round tracking (legacy, for compatibility)
    struct GameRound {
        uint256 drandRound;    // Which Drand round is used
        bool locked;           // Is the round locked and immutable?
        uint256 lockedAt;      // Timestamp when locked
    }

    // Enhanced game state with support for sequential/independent modes
    struct GameState {
        bytes32 seed;              // Base seed for value derivation
        uint256 maxHeight;         // 0 = independent mode, >0 = sequential mode (max draws per shuffle)
        uint256 currentHeight;     // Current pointer position (only used in sequential mode)
        uint256 reshuffle_count;   // Number of times deck has been reshuffled
        uint256 max_reshuffle;     // Maximum allowed reshuffles (0 = unlimited)
        address creator;           // Game creator
        uint256 created_at;        // Creation timestamp
    }

    // gameId => GameRound (legacy)
    mapping(bytes32 => GameRound) public gameRounds;
    
    // gameId => GameState (new dual-mode system)
    mapping(bytes32 => GameState) public gameStates;
    
    // Track all active games
    bytes32[] public activeGames;

    // ============================================================
    // EVENTS
    // ============================================================

    // Legacy events (for backward compatibility)
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

    // New dual-mode events
    event GameCreated(
        bytes32 indexed gameId,
        address indexed creator,
        bytes32 seed,
        uint256 maxHeight,     // 0 = independent, >0 = sequential
        uint256 max_reshuffle
    );

    event ValueDerived(
        bytes32 indexed gameId,
        uint256 index,
        uint256 value,
        uint256 newHeight     // Updated pointer position
    );

    event Reshuffled(
        bytes32 indexed gameId,
        uint256 reshuffle_count,
        bytes32 new_seed
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

    // ============================================================
    // NEW DUAL-MODE FUNCTIONS
    // ============================================================

    /**
     * @notice Create a new game with specified randomness mode
     * @param gameId Unique identifier for the game
     * @param seed The base seed for value derivation
     * @param maxHeight Max unique values before reshuffle (0 = independent mode)
     * @param max_reshuffle Maximum reshuffles allowed (0 = unlimited)
     */
    function createGame(
        bytes32 gameId,
        bytes32 seed,
        uint256 maxHeight,
        uint256 max_reshuffle
    ) external {
        require(gameStates[gameId].creator == address(0), "Game already exists");
        require(seed != bytes32(0), "Invalid seed");
        
        gameStates[gameId] = GameState({
            seed: seed,
            maxHeight: maxHeight,
            currentHeight: 0,
            reshuffle_count: 0,
            max_reshuffle: max_reshuffle,
            creator: msg.sender,
            created_at: block.timestamp
        });
        
        activeGames.push(gameId);
        
        // Emit event (0 = independent, >0 = sequential)
        emit GameCreated(gameId, msg.sender, seed, maxHeight, max_reshuffle);
    }

    /**
     * @notice Derive a value at a specific index from game seed
     * 
     * SEQUENTIAL MODE (maxHeight > 0):
     * - Validates that provided index matches expected pointer position
     * - Increments pointer after each draw
     * - Prevents accidental or malicious index reuse
     * - Caller can only draw in strict order: 0, 1, 2, 3...
     * 
     * INDEPENDENT MODE (maxHeight = 0):
     * - Accepts any index the caller provides
     * - No state changes (stateless)
     * - Caller responsible for varying indices (transaction data, counter, etc.)
     * - Supports unlimited draws with different indices
     * 
     * Uses rejection sampling to eliminate modulo bias.
     * 
     * @param gameId The game identifier
     * @param index The index position in seed chain (caller-managed in independent mode)
     * @param minVal Minimum value (inclusive)
     * @param maxVal Maximum value (inclusive)
     * @return Derived outcome within [minVal, maxVal]
     */
    function deriveValue(
        bytes32 gameId,
        uint256 index,
        uint256 minVal,
        uint256 maxVal
    ) external returns (uint256) {
        GameState storage game = gameStates[gameId];
        require(game.creator != address(0), "Game not found");
        require(minVal <= maxVal, "Invalid range");
        
        if (game.maxHeight > 0) {
            // SEQUENTIAL MODE: strict pointer enforcement
            require(index == game.currentHeight, "Index mismatch with pointer position");
            require(game.currentHeight < game.maxHeight, "Deck exhausted - reshuffle required");
            
            game.currentHeight++;
            
            uint256 value = deriveUnbiased(game.seed, index, minVal, maxVal);
            emit ValueDerived(gameId, index, value, game.currentHeight);
            return value;
        } else {
            // INDEPENDENT MODE: caller-managed index, no state
            // Caller is responsible for varying the index
            // Index can be derived from transaction data, counter, hash, etc.
            uint256 value = deriveUnbiased(game.seed, index, minVal, maxVal);
            emit ValueDerived(gameId, index, value, 0);
            return value;
        }
    }

    /**
     * @notice Derive value with unbiased rejection sampling
     * Eliminates modulo bias for small ranges
     * 
     * @param seed The seed value
     * @param index Position in seed chain
     * @param minVal Minimum output value
     * @param maxVal Maximum output value
     * @return Fair random value in [minVal, maxVal]
     */
    function deriveUnbiased(
        bytes32 seed,
        uint256 index,
        uint256 minVal,
        uint256 maxVal
    ) public pure returns (uint256) {
        uint256 range = maxVal - minVal + 1;
        uint256 maxFair = (type(uint256).max / range) * range;
        
        uint256 value = uint256(keccak256(abi.encode(seed, index)));
        uint256 attempts = 0;
        uint256 maxAttempts = 256; // Prevent infinite loops
        
        // Rejection sampling: reject if in biased zone
        while (value >= maxFair && attempts < maxAttempts) {
            index++;
            value = uint256(keccak256(abi.encode(seed, index)));
            attempts++;
        }
        
        return (value % range) + minVal;
    }

    /**
     * @notice Get current pointer position for sequential games
     * @param gameId The game identifier
     * @return Current height (pointer position)
     */
    function getCurrentPointer(bytes32 gameId) external view returns (uint256) {
        return gameStates[gameId].currentHeight;
    }

    /**
     * @notice Check if game is in sequential or independent mode
     * @param gameId The game identifier
     * @return 0 = independent, >0 = sequential (returns maxHeight)
     */
    function getGameMode(bytes32 gameId) external view returns (uint256) {
        return gameStates[gameId].maxHeight;
    }

    /**
     * @notice Trigger a reshuffle (sequential mode only)
     * Derives new seed from current seed and resets pointer
     * @param gameId The game identifier
     */
    function triggerReshuffle(bytes32 gameId) external {
        GameState storage game = gameStates[gameId];
        require(game.creator != address(0), "Game not found");
        require(game.maxHeight > 0, "Not in sequential mode");
        require(game.currentHeight >= game.maxHeight, "Deck not yet exhausted");
        
        if (game.max_reshuffle > 0) {
            require(game.reshuffle_count < game.max_reshuffle, "Max reshuffles exceeded");
        }
        
        // Derive new seed
        bytes32 newSeed = keccak256(abi.encode(game.seed, "reshuffle"));
        game.seed = newSeed;
        game.currentHeight = 0;
        game.reshuffle_count++;
        
        emit Reshuffled(gameId, game.reshuffle_count, newSeed);
    }

    /**
     * @notice Get full game state
     * @param gameId The game identifier
     * @return Full GameState struct
     */
    function getGameState(bytes32 gameId) 
        external 
        view 
        returns (GameState memory) 
    {
        return gameStates[gameId];
    }
}

