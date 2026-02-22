// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SeedCommit
 * @dev Minimal contract to record commitments of private seeds.
 *
 * Clients (servers or players) compute a seed off‑chain and submit its
 * SHA256/keccak256 hash on‑chain before revealing the seed.  The stored
 * commitment can later be used by anyone to verify that a revealed seed
 * matches the original commitment.  This contract contains no game logic
 * whatsoever; it merely provides a tamper‑evident on‑chain map.
 *
 * Designed for Polygon (chainId 137) but otherwise chain‑agnostic.  The
 * same contract can be deployed to any EVM‑compatible network.
 */

contract SeedCommit {
    /// @dev mapping from a game identifier to the committed anchor
    /// anchor = keccak256(seed || formulaBlob || otherParams)
    mapping(bytes32 => bytes32) public anchors;

    /// @dev emitted when an anchor is recorded
    event Anchored(bytes32 indexed gameId, bytes32 anchor);

    /**
     * @notice Record an immutable anchor for a game/seat.
     * @param gameId opaque identifier (e.g. hash of game metadata)
     * @param anchor keccak256 hash of the secret seed concatenated with
     *        whatever formula/parameters the server promises to use.
     *
     * Requirements:
     * - no prior anchor must exist for `gameId`
     *
     * The contract makes no attempt to interpret the anchor; it simply
     * stores it so anyone may later ensure a revealed formula exactly
     * matches the pre‑committed value.
     */
    function commit(bytes32 gameId, bytes32 anchor) external {
        require(anchors[gameId] == bytes32(0), "already anchored");
        anchors[gameId] = anchor;
        emit Anchored(gameId, anchor);
    }

    /**
     * @notice Verify that a provided blob matches the stored anchor.
     * @param gameId identifier used in `commit`
     * @param blob arbitrary data (seed || formula || params) whose hash
     *        should equal the recorded anchor.
     * @return ``true`` if ``keccak256(blob)`` is the stored anchor.
     *
     * This function is purely convenience; external verifiers can hash the
     * blob themselves and compare to the public mapping without invoking
     * the contract.
     */
    function verify(bytes32 gameId, bytes memory blob) external view returns (bool) {
        return anchors[gameId] == keccak256(blob);
    }
}
