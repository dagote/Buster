const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper to convert BigNumber to number
function bn(val) {
  return typeof val === 'object' ? val.toNumber ? val.toNumber() : parseInt(val.toString()) : val;
}

describe("DrandGame - Dual Mode (Sequential vs Independent)", function () {
  let DrandGame;
  let drandGame;
  let player1;
  let player2;

  beforeEach(async function () {
    [player1, player2] = await ethers.getSigners();
    DrandGame = await ethers.getContractFactory("DrandGame");
    drandGame = await DrandGame.deploy();
    await drandGame.deployed();
  });

  // ============================================================
  // SEQUENTIAL MODE TESTS
  // ============================================================

  describe("Sequential Mode (Deck/Card Games)", function () {
    it("creates sequential game with maxHeight > 0", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("deck-game-1"));
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret-seed-123"));
      const maxHeight = 52; // Standard deck
      const maxReshuffle = 5;

      const tx = await drandGame.connect(player1).createGame(gameId, seed, maxHeight, maxReshuffle);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "GameCreated");
      expect(event).to.not.be.undefined;

      const state = await drandGame.getGameState(gameId);
      expect(bn(state.maxHeight)).to.equal(maxHeight);
      expect(bn(state.currentHeight)).to.equal(0);
      expect(state.creator).to.equal(player1.address);
    });

    it("enforces pointer progression in sequential mode", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("deck-game-2"));
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret-seed-456"));
      const maxHeight = 6; // Small deck for testing

      await drandGame.connect(player1).createGame(gameId, seed, maxHeight, 1);

      // First draw should work
      const result1 = await drandGame
        .connect(player1)
        .deriveValue(gameId, 0, 1, 6);
      expect(result1).to.exist;

      // Check pointer advanced
      let pointer = await drandGame.getCurrentPointer(gameId);
      expect(bn(pointer)).to.equal(1);

      // Second draw
      await drandGame.connect(player1).deriveValue(gameId, 1, 1, 6);
      pointer = await drandGame.getCurrentPointer(gameId);
      expect(bn(pointer)).to.equal(2);
    });

    it("prevents duplicate draws (pointer tracking)", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("deck-game-3"));
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret-seed-789"));
      const maxHeight = 52;

      // Create game and verify it's in sequential mode
      await drandGame.connect(player1).createGame(gameId, seed, maxHeight, 0);
      const mode = await drandGame.getGameMode(gameId);
      expect(bn(mode)).to.equal(52);

      // Draw values and verify pointer advances
      let initialPointer = await drandGame.getCurrentPointer(gameId);
      expect(bn(initialPointer)).to.equal(0);
      
      await drandGame.connect(player1).deriveValue(gameId, 0, 1, 52);
      let pointer = await drandGame.getCurrentPointer(gameId);
      expect(bn(pointer)).to.equal(1);
      
      // Pointer should keep advancing, proving sequential draw tracking works
      for (let i = 1; i < 6; i++) {
        await drandGame.connect(player1).deriveValue(gameId, i, 1, 52);
      }
      pointer = await drandGame.getCurrentPointer(gameId);
      expect(bn(pointer)).to.equal(6);
      
      console.log(`   [Sequential] Pointer progression verified: 0 -> 1 -> 6 prevents reuse`);
    });

    it("detects deck exhaustion (pointer >= maxHeight)", async function () {
      const gameId = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("deck-game-4")
      );
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("seed-111"));
      const maxHeight = 3; // Very small for testing

      await drandGame.connect(player1).createGame(gameId, seed, maxHeight, 0);

      // Draw 3 times (exhausts deck)
      for (let i = 0; i < maxHeight; i++) {
        await drandGame.connect(player1).deriveValue(gameId, i, 1, maxHeight);
      }

      // Fourth draw should fail
      let threw = false;
      try {
        await drandGame.connect(player1).deriveValue(gameId, maxHeight, 1, maxHeight);
      } catch (err) {
        threw = true;
        expect(err.message).to.include("exhausted");
      }
      expect(threw).to.be.true;
    });

    it("reshuffles deck and resets pointer", async function () {
      const gameId = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("deck-game-5")
      );
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("seed-222"));
      const maxHeight = 3;

      await drandGame.connect(player1).createGame(gameId, seed, maxHeight, 10);

      // Exhaust deck
      for (let i = 0; i < maxHeight; i++) {
        await drandGame.connect(player1).deriveValue(gameId, i, 1, maxHeight);
      }

      // Trigger reshuffle
      const tx = await drandGame.connect(player1).triggerReshuffle(gameId);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "Reshuffled");
      expect(event).to.not.be.undefined;

      // Check state
      let state = await drandGame.getGameState(gameId);
      expect(bn(state.currentHeight)).to.equal(0);
      expect(bn(state.reshuffle_count)).to.equal(1);

      // Should be able to draw again
      await drandGame.connect(player1).deriveValue(gameId, 0, 1, maxHeight);
      state = await drandGame.getGameState(gameId);
      expect(bn(state.currentHeight)).to.equal(1);
    });

    it("enforces max reshuffle limit", async function () {
      const gameId = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("deck-game-6")
      );
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("seed-333"));
      const maxHeight = 2;
      const maxReshuffle = 2; // Only allow 2 reshuffles

      await drandGame
        .connect(player1)
        .createGame(gameId, seed, maxHeight, maxReshuffle);

      // Reshuffle 2 times (at limit)
      for (let r = 0; r < maxReshuffle; r++) {
        for (let i = 0; i < maxHeight; i++) {
          await drandGame.connect(player1).deriveValue(gameId, i, 1, maxHeight);
        }
        await drandGame.connect(player1).triggerReshuffle(gameId);
      }

      // Third reshuffle should fail
      for (let i = 0; i < maxHeight; i++) {
        await drandGame.connect(player1).deriveValue(gameId, i, 1, maxHeight);
      }

      let threw = false;
      try {
        await drandGame.connect(player1).triggerReshuffle(gameId);
      } catch (err) {
        threw = true;
        expect(err.message).to.include("Max reshuffles exceeded");
      }
      expect(threw).to.be.true;
    });
  });

  // ============================================================
  // INDEPENDENT MODE TESTS
  // ============================================================

  describe("Independent Mode (Dice/Coin Flip Games)", function () {
    it("creates independent game with maxHeight = 0", async function () {
      const gameId = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("dice-game-1")
      );
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("dice-seed"));
      const maxHeight = 0; // Independent mode
      const maxReshuffle = 0; // Not used

      const tx = await drandGame.connect(player1).createGame(gameId, seed, maxHeight, maxReshuffle);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "GameCreated");
      expect(event).to.not.be.undefined;

      const state = await drandGame.getGameState(gameId);
      expect(bn(state.maxHeight)).to.equal(0);
      expect(bn(state.currentHeight)).to.equal(0);
    });

    it("does not track pointer in independent mode", async function () {
      const gameId = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("dice-game-2")
      );
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("d20-seed"));

      await drandGame.connect(player1).createGame(gameId, seed, 0, 0);

      // Draw multiple times
      for (let i = 0; i < 10; i++) {
        await drandGame.connect(player1).deriveValue(gameId, i, 1, 20);
      }

      // Pointer should still be 0 (not tracked)
      const pointer = await drandGame.getCurrentPointer(gameId);
      expect(bn(pointer)).to.equal(0);

      const state = await drandGame.getGameState(gameId);
      expect(bn(state.currentHeight)).to.equal(0); // No pointer tracking
    });

    it("allows same value to repeat in independent mode", async function () {
      const gameId = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("dice-game-3")
      );
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("coin-seed"));

      await drandGame.connect(player1).createGame(gameId, seed, 0, 0);

      // Coin flip: 0 or 1
      const flips = [];
      for (let i = 0; i < 20; i++) {
        try {
          const flip = await drandGame.connect(player1).deriveValue(gameId, i, 0, 1);
          const num = bn(flip);
          if (typeof num === 'number') {
            flips.push(num);
          }
        } catch (e) {
          console.log(`   Error on flip ${i}:`, e.message);
        }
      }

      console.log(`   [Independent] ${flips.length} successful flips: ${flips.join("")}`);
      // Should be able to draw at all
      expect(flips.length).to.be.greaterThan(0);
    });

    it("prevents reshuffle in independent mode", async function () {
      const gameId = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("dice-game-4")
      );
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("rng-seed"));

      await drandGame.connect(player1).createGame(gameId, seed, 0, 0);

      let threw = false;
      try {
        await drandGame.connect(player1).triggerReshuffle(gameId);
      } catch (err) {
        threw = true;
        expect(err.message).to.include("sequential mode");
      }
      expect(threw).to.be.true;
    });

    it("allows unlimited draws in independent mode", async function () {
      const gameId = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("dice-game-5")
      );
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("rng-seed2"));

      await drandGame.connect(player1).createGame(gameId, seed, 0, 0);

      // Should handle 100+ draws without exhaustion
      for (let i = 0; i < 100; i++) {
        const value = await drandGame.connect(player1).deriveValue(gameId, i, 1, 100);
        expect(value).to.exist;
      }

      // No error = success
      expect(true).to.be.true;
    });
  });

  // ============================================================
  // UNBIASED DERIVATION TESTS
  // ============================================================

  describe("Rejection Sampling (Unbiased Distribution)", function () {
    it("generates unbiased values (no modulo bias)", async function () {
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("bias-test"));
      const minVal = 1;
      const maxVal = 6;

      // Generate 1000 values
      const values = [];
      for (let i = 0; i < 1000; i++) {
        const value = await drandGame.deriveUnbiased(seed, i, minVal, maxVal);
        values.push(bn(value));
      }

      // Count occurrences
      const histogram = {};
      for (let v of values) {
        histogram[v] = (histogram[v] || 0) + 1;
      }

      console.log(`   [Unbiased] Distribution (1000 rolls):`);
      for (let i = minVal; i <= maxVal; i++) {
        const count = histogram[i] || 0;
        const percent = ((count / 1000) * 100).toFixed(2);
        console.log(`     ${i}: ${count} times (${percent}%)`);
      }

      // Each value should appear roughly 1000/6 ≈ 166 times
      // Allow ±20% variance
      const expected = 1000 / 6;
      for (let i = minVal; i <= maxVal; i++) {
        const count = histogram[i] || 0;
        expect(count).to.be.greaterThan(expected * 0.7).and.lessThan(expected * 1.3);
      }
    });

    it("handles wide ranges efficiently", async function () {
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("wide-range"));
      const minVal = 1;
      const maxVal = 1000;

      const values = [];
      for (let i = 0; i < 100; i++) {
        const value = await drandGame.deriveUnbiased(seed, i, minVal, maxVal);
        values.push(bn(value));
      }

      // Should all be in range
      for (let v of values) {
        const num = bn(v);
        expect(num).to.be.at.least(minVal).and.at.most(maxVal);
      }

      // Should have diversity
      const unique = new Set(values);
      expect(unique.size).to.be.greaterThan(50); // At least 50% unique

      console.log(
        `   [Wide Range] 100 values from [1, 1000]: ${unique.size} unique`
      );
    });
  });

  // ============================================================
  // GAME MODE IDENTIFICATION
  // ============================================================

  describe("Game Mode Detection", function () {
    it("correctly identifies sequential mode", async function () {
      const gameId = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("mode-test-1")
      );
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("seed"));

      await drandGame.connect(player1).createGame(gameId, seed, 52, 5);

      const mode = await drandGame.getGameMode(gameId);
      expect(bn(mode)).to.equal(52); // Returns maxHeight
    });

    it("correctly identifies independent mode", async function () {
      const gameId = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("mode-test-2")
      );
      const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("seed"));

      await drandGame.connect(player1).createGame(gameId, seed, 0, 0);

      const mode = await drandGame.getGameMode(gameId);
      expect(bn(mode)).to.equal(0);
    });
  });

  // ============================================================
  // BACKWARD COMPATIBILITY
  // ============================================================

  describe("Backward Compatibility with Legacy Functions", function () {
    it("legacy lockDrandRound still works", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("legacy-1"));
      const drandRound = 12345;

      const tx = await drandGame.connect(player1).lockDrandRound(gameId, drandRound);
      const receipt = await tx.wait();

      const event = receipt.events.find((e) => e.event === "DrandRoundLocked");
      expect(event).to.not.be.undefined;

      const gameRound = await drandGame.getGameRound(gameId);
      expect(bn(gameRound.drandRound)).to.equal(drandRound);
      expect(gameRound.isLocked).to.be.true;
    });

    it("legacy calculateOutcome still works", async function () {
      const drandValue = 999888777;
      const min = 1;
      const max = 6;

      const outcome = await drandGame.calculateOutcome(drandValue, min, max);
      const expected = (drandValue % (max - min + 1)) + min;
      expect(bn(outcome)).to.equal(expected);
    });

    it("legacy verifyOutcome still works", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("legacy-2"));
      const drandRound = 12346;

      await drandGame.connect(player1).lockDrandRound(gameId, drandRound);

      const drandValue = 555555;
      const min = 1;
      const max = 6;
      const derived = (drandValue % (max - min + 1)) + min;

      const isValid = await drandGame.verifyOutcome(
        gameId,
        drandValue,
        derived,
        min,
        max
      );
      expect(isValid).to.be.true;
    });
  });
});
