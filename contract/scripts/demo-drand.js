const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("\n========== DRAND GAME PROTOCOL DEMO ==========\n");
  console.log("Deployer:", deployer.address);

  // Deploy or attach to existing contract
  let drandGame;
  const existingAddress = process.env.DRANDGAME_ADDRESS;

  if (existingAddress) {
    console.log(`\nAttaching to existing DrandGame at ${existingAddress}`);
    drandGame = await ethers.getContractAt("DrandGame", existingAddress);
  } else {
    console.log("\nDeploying new DrandGame contract...");
    const DrandGame = await ethers.getContractFactory("DrandGame");
    drandGame = await DrandGame.deploy();
    await drandGame.deployed();
    console.log("✓ DrandGame deployed to:", drandGame.address);
  }

  // STEP 1: Lock a Drand round
  console.log("\n--- STEP 1: Lock Drand Round ---");
  const gameId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("demo_game_1"));
  const drandRound = 8739; // Real Drand round (lookup at drandbeacon.io)

  console.log("Locking game", gameId.slice(0, 10) + "...");
  console.log("  to Drand round:", drandRound);

  const lockTx = await drandGame.lockDrandRound(gameId, drandRound);
  const lockReceipt = await lockTx.wait();

  const gameRoundData = await drandGame.getGameRound(gameId);
  console.log("✓ Locked! Status:", {
    drandRound: gameRoundData.drandRound.toNumber(),
    isLocked: gameRoundData.isLocked,
  });

  // STEP 2: Calculate outcome from Drand value
  console.log("\n--- STEP 2: Calculate Deterministic Outcome ---");
  // Real Drand value from round 8739 (this would come from API in production)
  const drandValue = 123456789; // "lookup from drandbeacon.io/round/8739"

  const outcome = await drandGame.calculateOutcome(drandValue, 1, 6);
  console.log("Drand value:", drandValue);
  console.log("Outcome range: 1-6 (single die)");
  console.log("✓ Calculated outcome:", outcome.toNumber());

  // Show the formula
  const manual = (BigInt(drandValue) % BigInt(6)) + BigInt(1);
  console.log("  Formula: (drandValue % 6) + 1 =", manual.toString());

  // STEP 3: Verify outcome is correct
  console.log("\n--- STEP 3: Verify Outcome ---");
  const isValid = await drandGame.verifyOutcome(gameId, drandValue, outcome, 1, 6);
  console.log("Claimed outcome:", outcome.toNumber());
  console.log("✓ Verification result:", isValid ? "✓ VALID" : "✗ INVALID");

  // STEP 4: Demonstrate public auditability
  console.log("\n--- STEP 4: Public Audit Trail ---");
  console.log("Anyone can verify this outcome:\n");
  console.log("1. Visit: https://drandbeacon.io/round/" + drandRound);
  console.log("2. Copy the randomness value");
  console.log("3. Call: drandGame.verifyOutcome()");
  console.log("   with:");
  console.log("   - gameId:", gameId);
  console.log("   - drandValue: <from API>");
  console.log("   - claimedOutcome:", outcome.toNumber());
  console.log("   - min: 1, max: 6");
  console.log("4. Returns: true if valid\n");

  // STEP 5: Show scalability to other ranges
  console.log("--- STEP 5: Scalability Examples ---");

  const coinFlip = await drandGame.calculateOutcome(drandValue, 0, 1);
  console.log("Coin flip (0-1):", coinFlip.toNumber());

  const percent = await drandGame.calculateOutcome(drandValue, 1, 100);
  console.log("Percentile (1-100):", percent.toNumber());

  const card = await drandGame.calculateOutcome(drandValue, 0, 51);
  console.log("Card index (0-51):", card.toNumber());

  console.log("\n========== PROTOCOL SUMMARY ==========");
  console.log("✓ lockDrandRound() - Commits to Drand round");
  console.log("✓ calculateOutcome() - Derives outcome from Drand");
  console.log("✓ verifyOutcome() - Validates any claimed outcome");
  console.log("✓ Trustless - No server required");
  console.log("✓ Public-auditable - Anyone can verify on drandbeacon.io\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
