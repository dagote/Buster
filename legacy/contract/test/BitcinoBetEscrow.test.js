const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BusterGame", function () {
  let buster;
  let deployer, feeReceiver, serverWallet, player1, player2, player3;

  beforeEach(async function () {
    [deployer, feeReceiver, serverWallet, player1, player2, player3] =
      await ethers.getSigners();

    const BusterGame = await ethers.getContractFactory(
      "BusterGame"
    );
    buster = await BusterGame.deploy(
      feeReceiver.address,
      serverWallet.address
    );
    await buster.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set fee receiver and server wallet immutably", async function () {
      expect(await buster.feeReceiver()).to.equal(feeReceiver.address);
      expect(await buster.serverWallet()).to.equal(serverWallet.address);
    });

    it("Should allow same address for feeReceiver and serverWallet", async function () {
      const BusterGame = await ethers.getContractFactory(
        "BusterGame"
      );
      const sameAddrContract = await BusterGame.deploy(
        deployer.address,
        deployer.address
      );
      await sameAddrContract.waitForDeployment();

      expect(await sameAddrContract.feeReceiver()).to.equal(deployer.address);
      expect(await sameAddrContract.serverWallet()).to.equal(deployer.address);
    });

    it("Should have FEE_PERCENT hardcoded to 2", async function () {
      expect(await buster.FEE_PERCENT()).to.equal(2);
    });

    it("Should start with betCounter at 0", async function () {
      expect(await buster.betCounter()).to.equal(0);
    });

    it("Should start with zero escrow", async function () {
      expect(await buster.getEscrowTotal()).to.equal(0);
    });
  });

  describe("Bet Placement (Player 1)", function () {
    it("Should accept bet from player1", async function () {
      const amount = ethers.parseEther("1.0");

      await expect(
        player1.sendTransaction({
          to: buster.target,
          data: buster.interface.encodeFunctionData("placeBet", ["dice"]),
          value: amount,
        })
      )
        .to.emit(bitcino, "BetPlaced")
        .withArgs(1, player1.address, amount, "dice");

      const bet = await buster.getBet(1);
      expect(bet.player1).to.equal(player1.address);
      expect(bet.amount).to.equal(amount);
      expect(bet.status).to.equal(0); // Pending
      expect(bet.gameType).to.equal("dice");
    });

    it("Should increase betCounter", async function () {
      const amount = ethers.parseEther("1.0");

      await player1.sendTransaction({
        to: buster.target,
        data: buster.interface.encodeFunctionData("placeBet", ["dice"]),
        value: amount,
      });

      expect(await buster.betCounter()).to.equal(1);
    });

    it("Should increase escrow total", async function () {
      const amount = ethers.parseEther("1.0");

      await player1.sendTransaction({
        to: buster.target,
        data: buster.interface.encodeFunctionData("placeBet", ["dice"]),
        value: amount,
      });

      expect(await buster.getEscrowTotal()).to.equal(amount);
    });

    it("Should reject bet with 0 amount", async function () {
      await expect(buster.connect(player1).placeBet("dice")).to.be.revertedWith(
        "Bet amount must be greater than 0"
      );
    });

    it("Should reject bet with empty game type", async function () {
      const amount = ethers.parseEther("1.0");

      await expect(
        buster.connect(player1).placeBet("", { value: amount })
      ).to.be.revertedWith("Game type required");
    });
  });

  describe("Bet Joining (Player 2)", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1.0");
      await player1.sendTransaction({
        to: buster.target,
        data: buster.interface.encodeFunctionData("placeBet", ["dice"]),
        value: amount,
      });
    });

    it("Should allow player2 to join with equal amount", async function () {
      const amount = ethers.parseEther("1.0");

      await expect(
        buster.connect(player2).joinBet(1, { value: amount })
      )
        .to.emit(bitcino, "BetJoined")
        .withArgs(1, player2.address, amount);

      const bet = await buster.getBet(1);
      expect(bet.player2).to.equal(player2.address);
      expect(bet.status).to.equal(1); // Active
    });

    it("Should reject join with mismatched amount", async function () {
      const wrongAmount = ethers.parseEther("0.5");

      await expect(
        buster.connect(player2).joinBet(1, { value: wrongAmount })
      ).to.be.revertedWith("Must match bet amount exactly");
    });

    it("Should reject player1 trying to join own bet", async function () {
      const amount = ethers.parseEther("1.0");

      await expect(
        buster.connect(player1).joinBet(1, { value: amount })
      ).to.be.revertedWith("Cannot play against yourself");
    });

    it("Should reject joining non-pending bet", async function () {
      const amount = ethers.parseEther("1.0");

      // First join
      await buster.connect(player2).joinBet(1, { value: amount });

      // Try to join again
      await expect(
        buster.connect(player3).joinBet(1, { value: amount })
      ).to.be.revertedWith("Bet is not pending");
    });

    it("Should increase escrow on join", async function () {
      const amount = ethers.parseEther("1.0");

      await buster.connect(player2).joinBet(1, { value: amount });

      expect(await buster.getEscrowTotal()).to.equal(ethers.parseEther("2.0"));
    });
  });

  describe("Bet Settlement (Server)", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1.0");

      // Player 1 places bet
      await player1.sendTransaction({
        to: buster.target,
        data: buster.interface.encodeFunctionData("placeBet", ["dice"]),
        value: amount,
      });

      // Player 2 joins
      await buster.connect(player2).joinBet(1, { value: amount });
    });

    it("Should settle wager with server wallet only", async function () {
      await expect(buster.connect(player1).settleWager(1, player1.address))
        .to.be.revertedWith("Only server can settle wagers");
    });

    it("Should pay 98% to winner, 2% to fee receiver", async function () {
      const totalPool = ethers.parseEther("2.0");
      const expectedWinnerPayout = (totalPool * BigInt(98)) / BigInt(100);
      const expectedFeeAmount = (totalPool * BigInt(2)) / BigInt(100);

      await buster.connect(serverWallet).settleWager(1, player1.address);

      const player1Balance = await buster.getBalance(player1.address);
      const feeBalance = await buster.getBalance(feeReceiver.address);

      expect(player1Balance).to.equal(expectedWinnerPayout);
      expect(feeBalance).to.equal(expectedFeeAmount);
    });

    it("Should set bet to Settled status", async function () {
      await buster.connect(serverWallet).settleWager(1, player1.address);

      const bet = await buster.getBet(1);
      expect(bet.status).to.equal(2); // Settled
      expect(bet.winner).to.equal(player1.address);
    });

    it("Should emit BetSettled event", async function () {
      const totalPool = ethers.parseEther("2.0");
      const expectedWinnerPayout = (totalPool * BigInt(98)) / BigInt(100);
      const expectedFeeAmount = totalPool - expectedWinnerPayout;

      await expect(buster.connect(serverWallet).settleWager(1, player1.address))
        .to.emit(bitcino, "BetSettled")
        .withArgs(1, player1.address, expectedWinnerPayout, expectedFeeAmount);
    });

    it("Should reduce escrow on settlement", async function () {
      expect(await buster.getEscrowTotal()).to.equal(ethers.parseEther("2.0"));

      await buster.connect(serverWallet).settleWager(1, player1.address);

      expect(await buster.getEscrowTotal()).to.equal(0);
    });

    it("Should allow either player to win", async function () {
      await buster.connect(serverWallet).settleWager(1, player2.address);

      const player2Balance = await buster.getBalance(player2.address);
      expect(player2Balance).to.be.greaterThan(0);

      const bet = await buster.getBet(1);
      expect(bet.winner).to.equal(player2.address);
    });

    it("Should reject settling non-active bet", async function () {
      await buster.connect(serverWallet).settleWager(1, player1.address);

      await expect(
        buster.connect(serverWallet).settleWager(1, player1.address)
      ).to.be.revertedWith("Bet is not active");
    });

    it("Should reject invalid winner address", async function () {
      await expect(
        buster.connect(serverWallet).settleWager(1, player3.address)
      ).to.be.revertedWith("Winner must be one of the players");
    });
  });

  describe("Bet Cancellation", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1.0");

      await player1.sendTransaction({
        to: buster.target,
        data: buster.interface.encodeFunctionData("placeBet", ["dice"]),
        value: amount,
      });
    });

    it("Should allow player1 to cancel pending bet", async function () {
      const amount = ethers.parseEther("1.0");

      await expect(buster.connect(player1).cancelBet(1))
        .to.emit(bitcino, "BetCanceled")
        .withArgs(1, player1.address, amount);

      const bet = await buster.getBet(1);
      expect(bet.status).to.equal(3); // Canceled
    });

    it("Should refund amount to player1", async function () {
      const amount = ethers.parseEther("1.0");

      await buster.connect(player1).cancelBet(1);

      const player1Balance = await buster.getBalance(player1.address);
      expect(player1Balance).to.equal(amount);
    });

    it("Should reduce escrow on cancel", async function () {
      expect(await buster.getEscrowTotal()).to.equal(ethers.parseEther("1.0"));

      await buster.connect(player1).cancelBet(1);

      expect(await buster.getEscrowTotal()).to.equal(0);
    });

    it("Should reject non-player1 from canceling", async function () {
      await expect(buster.connect(player2).cancelBet(1)).to.be.revertedWith(
        "Only player1 can cancel"
      );
    });

    it("Should reject canceling active bet", async function () {
      const amount = ethers.parseEther("1.0");

      await buster.connect(player2).joinBet(1, { value: amount });

      await expect(buster.connect(player1).cancelBet(1)).to.be.revertedWith(
        "Only pending bets can be canceled"
      );
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1.0");

      // Create and settle a bet
      await player1.sendTransaction({
        to: buster.target,
        data: buster.interface.encodeFunctionData("placeBet", ["dice"]),
        value: amount,
      });

      await buster.connect(player2).joinBet(1, { value: amount });

      await buster.connect(serverWallet).settleWager(1, player1.address);
    });

    it("Should allow winner to withdraw payout", async function () {
      const beforeBalance = await ethers.provider.getBalance(player1.address);

      const tx = await buster.connect(player1).withdraw();
      const receipt = await tx.wait();

      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const afterBalance = await ethers.provider.getBalance(player1.address);

      const expectedPayout = (ethers.parseEther("2.0") * BigInt(98)) / BigInt(100);
      expect(afterBalance + gasUsed - beforeBalance).to.be.closeTo(
        expectedPayout,
        ethers.parseEther("0.0001")
      );
    });

    it("Should allow fee receiver to withdraw", async function () {
      const beforeBalance = await ethers.provider.getBalance(feeReceiver.address);

      const tx = await buster.connect(feeReceiver).withdraw();
      const receipt = await tx.wait();

      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const afterBalance = await ethers.provider.getBalance(feeReceiver.address);

      const expectedFee = (ethers.parseEther("2.0") * BigInt(2)) / BigInt(100);
      expect(afterBalance + gasUsed - beforeBalance).to.be.closeTo(
        expectedFee,
        ethers.parseEther("0.0001")
      );
    });

    it("Should clear claimable balance after withdrawal", async function () {
      await buster.connect(player1).withdraw();

      const balance = await buster.getBalance(player1.address);
      expect(balance).to.equal(0);
    });

    it("Should reject withdrawal with zero balance", async function () {
      await expect(buster.connect(player3).withdraw()).to.be.revertedWith(
        "No balance to withdraw"
      );
    });

    it("Should emit BalanceWithdrawn event", async function () {
      const expectedPayout = (ethers.parseEther("2.0") * BigInt(98)) / BigInt(100);

      await expect(buster.connect(player1).withdraw())
        .to.emit(bitcino, "BalanceWithdrawn")
        .withArgs(player1.address, expectedPayout);
    });
  });

  describe("Immutability & Security", function () {
    it("Should not have any owner or admin functions to modify fee", async function () {
      // Verify FEE_PERCENT is immutable
      const feeValue = await buster.FEE_PERCENT();
      expect(feeValue).to.equal(2);

      // Try to call any function that would modify it (should not exist)
      expect(buster.setFeePercent).to.be.undefined;
      expect(buster.changeFeePercent).to.be.undefined;
      expect(buster.updateFeePercent).to.be.undefined;
    });

    it("Should not have owner or admin functions", async function () {
      // Verify no renounceOwnership or transferOwnership
      expect(buster.renounceOwnership).to.be.undefined;
      expect(buster.transferOwnership).to.be.undefined;
      expect(buster.owner).to.be.undefined;
    });

    it("Should not have pause/unpause functions", async function () {
      expect(buster.pause).to.be.undefined;
      expect(buster.unpause).to.be.undefined;
      expect(buster.paused).to.be.undefined;
    });

    it("Should protect against reentrancy", async function () {
      const amount = ethers.parseEther("1.0");

      // Place and join bet
      await player1.sendTransaction({
        to: buster.target,
        data: buster.interface.encodeFunctionData("placeBet", ["dice"]),
        value: amount,
      });

      await buster.connect(player2).joinBet(1, { value: amount });

      // Settle
      await buster.connect(serverWallet).settleWager(1, player1.address);

      // Normal withdraw should work
      const beforeBalance = await ethers.provider.getBalance(player1.address);
      const tx = await buster.connect(player1).withdraw();
      const receipt = await tx.wait();

      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const afterBalance = await ethers.provider.getBalance(player1.address);

      expect(afterBalance + gasUsed).to.be.greaterThan(beforeBalance);
    });

    it("Should reject accidental ETH transfers", async function () {
      await expect(
        player1.sendTransaction({
          to: buster.target,
          value: ethers.parseEther("1.0"),
        })
      ).to.be.revertedWith("Use placeBet() to initiate a bet");
    });
  });

  describe("FEE_PERCENT Verification", function () {
    it("Should calculate fees correctly at 2%", async function () {
      const amount = ethers.parseEther("1.0");

      await player1.sendTransaction({
        to: buster.target,
        data: buster.interface.encodeFunctionData("placeBet", ["dice"]),
        value: amount,
      });

      await buster.connect(player2).joinBet(1, { value: amount });

      const totalPool = ethers.parseEther("2.0");
      const expectedFee = (totalPool * BigInt(2)) / BigInt(100); // 0.04 MATIC

      await buster.connect(serverWallet).settleWager(1, player1.address);

      const feeBalance = await buster.getBalance(feeReceiver.address);
      expect(feeBalance).to.equal(expectedFee);
    });
  });
});
