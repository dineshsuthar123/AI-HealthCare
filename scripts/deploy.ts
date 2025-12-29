import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying HealthRecordVerification to Sepolia...\n");

  // Get deployer info
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  if (balance < ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance! Need at least 0.01 ETH for deployment.");
    console.log("   Get Sepolia ETH from: https://sepoliafaucet.com");
    process.exit(1);
  }

  // Deploy contract
  console.log("📦 Deploying HealthRecordVerification...");
  const HealthRecordVerification = await ethers.getContractFactory("HealthRecordVerification");
  const contract = await HealthRecordVerification.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ Contract deployed successfully!");
  console.log("   Address:", contractAddress);
  console.log("   View on Etherscan: https://sepolia.etherscan.io/address/" + contractAddress);

  // Update .env.local with contract address
  const envPath = path.join(__dirname, "..", ".env.local");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  if (envContent.includes("HEALTH_RECORD_CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /HEALTH_RECORD_CONTRACT_ADDRESS=.*/,
      `HEALTH_RECORD_CONTRACT_ADDRESS=${contractAddress}`
    );
  } else {
    envContent += `\n# Deployed Smart Contract (Sepolia)\nHEALTH_RECORD_CONTRACT_ADDRESS=${contractAddress}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("\n📝 Updated .env.local with contract address");

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: contract.deploymentTransaction()?.hash,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "sepolia.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("📄 Saved deployment info to deployments/sepolia.json");

  console.log("\n🎉 Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Verify the contract: npx hardhat verify --network sepolia", contractAddress);
  console.log("2. Restart your dev server");
  console.log("3. Test blockchain integration in Health Records");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
