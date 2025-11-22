import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying PixelMintMarketplace to", network.name);
  console.log("Deployer address:", deployer.address);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "MATIC");

  // Deploy PixelMintMarketplace contract only
  console.log("\nDeploying PixelMintMarketplace...");
  const PixelMintMarketplace = await ethers.getContractFactory("PixelMintMarketplace");
  const pixelMintMarketplace = await PixelMintMarketplace.deploy(deployer.address);
  await pixelMintMarketplace.waitForDeployment();
  const pixelMintMarketplaceAddress = await pixelMintMarketplace.getAddress();
  console.log("PixelMintMarketplace deployed to:", pixelMintMarketplaceAddress);

  // Print deployment summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Address:");
  console.log("PixelMintMarketplace:", pixelMintMarketplaceAddress);
  console.log("\nNext steps:");
  console.log("1. Update .env file in apps/web with this address:");
  console.log(`   NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=${pixelMintMarketplaceAddress}`);
  console.log("2. Keep your existing NFT contract address");
  
  // Save address to a file for easy reference
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    contracts: {
      PixelMintMarketplace: pixelMintMarketplaceAddress,
    },
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    "deployment-marketplace-only.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment-marketplace-only.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

