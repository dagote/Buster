const { expect } = require("chai");

describe("DrandGame", function () {
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

  describe("lockDrandRound", function () {
    it("allows player to lock a Drand round for their game", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("game1"));
      const drandRound = 12345;

      const tx = await drandGame.connect(player1).lockDrandRound(gameId, drandRound);
      const receipt = await tx.wait();

      const event = receipt.events.find((e) => e.event === "DrandRoundLocked");
      expect(event).to.not.be.undefined;
      expect(event.args.gameId).to.equal(gameId);
      expect(event.args.drandRound.toString()).to.equal(drandRound.toString());

      const gameRound = await drandGame.getGameRound(gameId);
      expect(gameRound.drandRound.toString()).to.equal(drandRound.toString());
      expect(gameRound.isLocked).to.be.true;
    });

    it("prevents relocking the same game", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("game2"));
      const drandRound = 12346;

      await drandGame.connect(player1).lockDrandRound(gameId, drandRound);

      let threw = false;
      try {
        await drandGame.connect(player1).lockDrandRound(gameId, 12347);
      } catch (err) {
        threw = true;
        expect(err.message).to.include("already locked");
      }
      expect(threw).to.be.true;
    });

    it("rejects invalid round number", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("game3"));

      let threw = false;
      try {
        await drandGame.connect(player1).lockDrandRound(gameId, 0);
      } catch (err) {
        threw = true;
        expect(err.message).to.include("Invalid");
      }
      expect(threw).to.be.true;
    });
  });

  describe("calculateOutcome", function () {
    it("derives outcome for dice (1-6) correctly", async function () {
      // Real Drand value example
      const drandValue = 999888777;
      const min = 1;
      const max = 6;

      const outcome = await drandGame.calculateOutcome(drandValue, min, max);

      // Manual: (999888777 % 6) + 1 = (3) + 1 = 4
      const expected = (BigInt(drandValue) % BigInt(max - min + 1)) + BigInt(min);
      expect(outcome.toString()).to.equal(expected.toString());
    });

    it("derives outcome for d12 (two dice) correctly", async function () {
      const drandValue = 123456789;
      const min = 2;
      const max = 12;

      const outcome = await drandGame.calculateOutcome(drandValue, min, max);

      const expected = (BigInt(drandValue) % BigInt(max - min + 1)) + BigInt(min);
      expect(outcome.toString()).to.equal(expected.toString());
    });

    it("works for any range (percentiles, coin flips, etc)", async function () {
      const drandValue = 555555555;

      // Coin flip (0 or 1)
      const coinFlip = await drandGame.calculateOutcome(drandValue, 0, 1);
      expect(coinFlip.toNumber()).to.be.oneOf([0, 1]);

      // Percentile (1-100)
      const percent = await drandGame.calculateOutcome(drandValue, 1, 100);
      expect(percent.toNumber()).to.be.at.least(1).and.at.most(100);

      // Card index (0-51)
      const card = await drandGame.calculateOutcome(drandValue, 0, 51);
      expect(card.toNumber()).to.be.at.least(0).and.at.most(51);
    });

    it("rejects invalid ranges", async function () {
      let threw = false;
      try {
        await drandGame.calculateOutcome(123456, 10, 5); // max < min
      } catch (err) {
        threw = true;
        expect(err.message).to.include("Invalid");
      }
      expect(threw).to.be.true;
    });
  });

  describe("verifyOutcome", function () {
    it("validates correct outcome against Drand value", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("game4"));
      const drandRound = 12345;
      const drandValue = 999888777;
      const min = 1;
      const max = 6;

      // Lock the round
      await drandGame.connect(player1).lockDrandRound(gameId, drandRound);

      // Calculate expected outcome
      const expected = (BigInt(drandValue) % BigInt(max - min + 1)) + BigInt(min);

      // Verify it matches
      const isValid = await drandGame.verifyOutcome(
        gameId,
        drandValue,
        expected,
        min,
        max
      );

      expect(isValid).to.be.true;
    });

    it("rejects incorrect outcome", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("game5"));
      const drandRound = 12346;
      const drandValue = 999888777;
      const min = 1;
      const max = 6;

      await drandGame.connect(player1).lockDrandRound(gameId, drandRound);

      // Claim wrong outcome
      const wrongOutcome = 99;

      const isValid = await drandGame.verifyOutcome(
        gameId,
        drandValue,
        wrongOutcome,
        min,
        max
      );

      expect(isValid).to.be.false;
    });

    it("rejects verification for unlocked game", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("game6"));

      let threw = false;
      try {
        await drandGame.verifyOutcome(gameId, 123456, 5, 1, 6);
      } catch (err) {
        threw = true;
        expect(err.message).to.include("not locked");
      }
      expect(threw).to.be.true;
    });

    it("returns verified outcome correctly", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("game7"));
      const drandRound = 12347;
      const drandValue = 555555555;

      await drandGame.connect(player1).lockDrandRound(gameId, drandRound);

      const outcome = await drandGame.calculateOutcome(drandValue, 1, 6);

      const isValid = await drandGame.verifyOutcome(gameId, drandValue, outcome, 1, 6);

      expect(isValid).to.be.true;
    });
  });

  describe("getGameRound", function () {
    it("returns locked round and timestamp", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("game8"));
      const drandRound = 12348;

      const txBlock = await ethers.provider.getBlockNumber();
      await drandGame.connect(player1).lockDrandRound(gameId, drandRound);
      const finalBlock = await ethers.provider.getBlockNumber();

      const gameRound = await drandGame.getGameRound(gameId);

      expect(gameRound.drandRound.toString()).to.equal(drandRound.toString());
      expect(gameRound.isLocked).to.be.true;
      expect(gameRound.timestamp.toNumber()).to.be.greaterThan(0);
    });

    it("returns unlock status for new games", async function () {
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("game9"));

      const gameRound = await drandGame.getGameRound(gameId);

      expect(gameRound.drandRound.toNumber()).to.equal(0);
      expect(gameRound.isLocked).to.be.false;
      expect(gameRound.timestamp.toNumber()).to.equal(0);
    });
  });

  describe("Protocol Flow (End-to-End)", function () {
    it("demonstrates full game flow: lock → calculate → verify", async function () {
      // Step 1: Player creates game and locks Drand round
      const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("multiplayer_game"));
      const drandRound = 99999; // "lookup at drandbeacon.io/round/99999"

      await drandGame.connect(player1).lockDrandRound(gameId, drandRound);

      // Step 2: Get actual Drand value from blockchain or API
      // For testing, we use a realistic value
      const drandValue = 777666555; // "from drandbeacon.io API"

      // Step 3: Both players independently calculate outcome
      const player1Outcome = await drandGame.calculateOutcome(drandValue, 1, 6);
      const player2Outcome = await drandGame.calculateOutcome(drandValue, 1, 6);

      // Should be identical (deterministic)
      expect(player1Outcome.toString()).to.equal(player2Outcome.toString());

      // Step 4: Anyone can verify the outcome is correct
      const verified = await drandGame.verifyOutcome(
        gameId,
        drandValue,
        player1Outcome,
        1,
        6
      );

      expect(verified).to.be.true;

      // Step 5: Can audit on drandbeacon.io
      // Visit: https://drandbeacon.io/round/99999
      // Verify: randomness matches drandValue
      // Recalculate: (drandValue % 6) + 1
      // Compare: matches outcome from contract
    });
  });
});
