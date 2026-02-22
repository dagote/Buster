/**
 * Demo script illustrating the full anchor+verification sequence on-chain.
 *
 * Run against the built-in Hardhat network or any configured network such
 * as `amoy` (Polygon Mumbai).  This script:
 *
 * 1. Deploys the SeedCommit contract.
 * 2. Creates an "anchor" from a seed+formula blob.
 * 3. Submits the anchor on-chain.
 * 4. Later, simulates revealing the blob and verifies on-chain that it
 *    matches the stored anchor.
 *
 * Usage:
 *   npx hardhat run scripts/demo.js --network localhost
 *   npx hardhat run scripts/demo.js --network amoy
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using deployer", deployer.address);

  const SeedCommit = await ethers.getContractFactory("SeedCommit");
  let seedCommit;
  const existing = process.env.SEEDCOMMIT_ADDRESS;
  if (existing) {
    console.log("Attaching to existing SeedCommit at", existing);
    seedCommit = SeedCommit.attach(existing);
  } else {
    seedCommit = await SeedCommit.deploy();
    await seedCommit.deployed();
    console.log("SeedCommit deployed at", seedCommit.address);
  }

  // --- prepare anchor ---
  const seed = ethers.utils.toUtf8Bytes("my-secret-seed");
  const formula = ethers.utils.toUtf8Bytes("outcome = H(seed||rnd)");
  const blob = ethers.utils.concat([seed, formula]);
  const anchor = ethers.utils.keccak256(blob);
  console.log("Computed anchor", anchor);

  const gameId = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("demo-game-1")
  );

  // commit anchor on-chain
  const tx = await seedCommit.commit(gameId, anchor);
  await tx.wait();
  console.log("Anchor committed for gameId", gameId);

  // later: reveal and verify
  const revealedBlob = blob; // in real life, you would supply seed+formula
  const onchainCheck = await seedCommit.verify(gameId, revealedBlob);
  console.log("On-chain verification of revealed blob:", onchainCheck);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });