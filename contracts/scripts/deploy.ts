import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contracts to", network.name);
  console.log("Deployer address:", deployer.address);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "MATIC");

  // Deploy PixelMintNFT contract
  console.log("\n1. Deploying PixelMintNFT...");
  const PixelMintNFT = await ethers.getContractFactory("PixelMintNFT");
  const pixelMintNFT = await PixelMintNFT.deploy(
    deployer.address, // initialOwner
    "Pixel Mint NFT", // name
    "PMNFT" // symbol
  );
  await pixelMintNFT.waitForDeployment();
  const pixelMintNFTAddress = await pixelMintNFT.getAddress();
  console.log("PixelMintNFT deployed to:", pixelMintNFTAddress);

  // Deploy PixelMintMarketplace contract
  console.log("\n2. Deploying PixelMintMarketplace...");
  const PixelMintMarketplace = await ethers.getContractFactory("PixelMintMarketplace");
  const pixelMintMarketplace = await PixelMintMarketplace.deploy(deployer.address);
  await pixelMintMarketplace.waitForDeployment();
  const pixelMintMarketplaceAddress = await pixelMintMarketplace.getAddress();
  console.log("PixelMintMarketplace deployed to:", pixelMintMarketplaceAddress);

  // Print deployment summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("PixelMintNFT:", pixelMintNFTAddress);
  console.log("PixelMintMarketplace:", pixelMintMarketplaceAddress);
  console.log("\nNext steps:");
  console.log("1. Update .env file in apps/web with these addresses:");
  console.log(`   NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${pixelMintNFTAddress}`);
  console.log(`   NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=${pixelMintMarketplaceAddress}`);
  console.log("2. Update your frontend code to use these addresses");
  
  // Save addresses to a file for easy reference
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    contracts: {
      PixelMintNFT: pixelMintNFTAddress,
      PixelMintMarketplace: pixelMintMarketplaceAddress,
    },
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

