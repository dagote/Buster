const { expect } = require("chai");

describe("SeedCommit", function () {
  let SeedCommit;
  let seedCommit;
  let owner;
  let other;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    SeedCommit = await ethers.getContractFactory("SeedCommit");
    seedCommit = await SeedCommit.deploy();
    await seedCommit.deployed();
  });

  it("allows a game to be anchored and emits an event", async function () {
    const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("game1"));
    // anchor could be seed||formula; here we just hash a string
    const anchor = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("foo"));

    const tx = await seedCommit.commit(gameId, anchor);
    const receipt = await tx.wait();
    const ev = receipt.events.find(e => e.event === "Anchored");
    expect(ev).to.not.be.undefined;
    expect(ev.args.gameId).to.equal(gameId);
    expect(ev.args.anchor).to.equal(anchor);

    expect(await seedCommit.anchors(gameId)).to.equal(anchor);
  });

  it("reverts if anchor already exists", async function () {
    const gameId = ethers.utils.zeroPad(ethers.utils.arrayify(1), 32);
    const anchor = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("foo"));
    await seedCommit.commit(gameId, anchor);
    let threw = false;
    try {
      await seedCommit.commit(gameId, anchor);
    } catch (err) {
      threw = true;
      expect(err.message).to.include("already anchored");
    }
    expect(threw).to.be.true;
  });

  it("verify helper should return true for matching seed", async function () {
    const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("game2"));
    const rawSeed = ethers.utils.toUtf8Bytes("s1");
    const hash = ethers.utils.keccak256(rawSeed);
    await seedCommit.commit(gameId, hash);
    expect(await seedCommit.verify(gameId, rawSeed)).to.equal(true);
    expect(await seedCommit.verify(gameId, ethers.utils.toUtf8Bytes("nope"))).to.equal(false);
  });
});
