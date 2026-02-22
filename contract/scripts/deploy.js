async function main() {
  const SeedCommit = await ethers.getContractFactory("SeedCommit");
  const seedCommit = await SeedCommit.deploy();
  await seedCommit.deployed();
  console.log("SeedCommit deployed to", seedCommit.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});