# Pixel Mint Blockchain Flow Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Smart Contracts](#smart-contracts)
3. [Minting Flow](#minting-flow)
4. [Listing Flow](#listing-flow)
5. [Buying Flow](#buying-flow)
6. [Selling/Delisting Flow](#selling-delisting-flow)
7. [Technology Stack](#technology-stack)
8. [Gas Optimization](#gas-optimization)
9. [Error Handling](#error-handling)
10. [Security Considerations](#security-considerations)

---

## Architecture Overview

Pixel Mint is built on a **hybrid architecture** that combines:
- **Off-chain Database (PostgreSQL)**: Stores metadata, user info, search indexes
- **IPFS**: Decentralized storage for NFT images and metadata
- **Blockchain (Polygon Amoy Testnet)**: Immutable ownership and transaction records
- **Smart Contracts**: NFT minting and marketplace logic

### Why This Hybrid Approach?

1. **Performance**: Database queries are instant, blockchain reads can be slow
2. **Cost**: Storing metadata on-chain is expensive (gas fees)
3. **Flexibility**: Can update UI/search without blockchain transactions
4. **Decentralization**: Ownership and transfers are still on-chain and verifiable

---

## Smart Contracts

### 1. PixelMintNFT Contract (ERC-721)

**Location**: `/contracts/contracts/PixelMintNFT.sol`

**Purpose**: Handle NFT minting and ownership

**Key Features**:
- ERC-721 standard compliance
- IPFS URI storage
- Creator tracking
- Batch minting support
- Maximum supply cap (1,000,000 NFTs)

**Main Functions**:

```solidity
// Mint a single NFT
function mint(address to, string memory tokenURI) 
    public 
    nonReentrant 
    returns (uint256)

// Mint multiple NFTs in one transaction
function batchMint(address to, string[] memory tokenURIs) 
    public 
    nonReentrant 
    returns (uint256[] memory)

// Get the creator of an NFT
function getCreator(uint256 tokenId) 
    public 
    view 
    returns (address)

// Get mint timestamp
function getMintTimestamp(uint256 tokenId) 
    public 
    view 
    returns (uint256)

// Check if token exists
function exists(uint256 tokenId) 
    public 
    view 
    returns (bool)
```

**Key Properties**:
- `_tokenIdCounter`: Increments with each mint (starts at 1)
- `creators`: Mapping of tokenId => creator address
- `mintTimestamps`: Mapping of tokenId => mint timestamp
- `MAX_SUPPLY`: 1,000,000 maximum NFTs

---

### 2. PixelMintMarketplace Contract

**Location**: `/contracts/contracts/PixelMintMarketplace.sol`

**Purpose**: Enable NFT trading with atomic swaps

**Key Features**:
- **Lazy Listing**: NFT stays with seller (saves gas)
- **Atomic Swaps**: Payment + transfer in one transaction
- **Zero Fees**: Default 0% marketplace fee
- **Seller Protection**: Only owner can list/delist

**Main Functions**:

```solidity
// List NFT for sale (lazy listing - NFT stays with seller)
function listNFT(
    address nftContract,
    uint256 tokenId,
    uint256 price
) external nonReentrant

// Remove listing
function delistNFT(
    address nftContract,
    uint256 tokenId
) external nonReentrant

// Buy NFT (atomic swap - payment + transfer together)
function buyNFT(
    address nftContract,
    uint256 tokenId
) external payable nonReentrant

// Get listing details
function getListing(
    address nftContract,
    uint256 tokenId
) external view returns (
    address seller,
    uint256 price,
    bool isActive,
    uint256 listedAt
)
```

**Listing Structure**:
```solidity
struct Listing {
    address seller;
    address nftContract;
    uint256 tokenId;
    uint256 price;
    bool isActive;
    uint256 listedAt;
}
```

**Gas Optimization**:
- Uses lazy listing (NFT stays with seller)
- No array storage (uses mapping only)
- Requires one-time approval via `setApprovalForAll`

---

## Minting Flow

### Overview
Users create NFTs by uploading artwork, which is stored on IPFS, then minted on the blockchain.

### Step-by-Step Process

#### 1. **User Uploads Artwork**
**File**: `/apps/web/components/create-nft/CreateNFTClient.tsx`

```typescript
// User selects file
const handleImageChange = (file: File | null) => {
  // Validate file type and size
  const validTypes = ["image/jpeg", "image/png", "image/gif", ...];
  if (!validTypes.includes(file.type)) {
    toast.error("Unsupported file type");
    return;
  }
  
  // Max 100MB
  if (file.size > 100 * 1024 * 1024) {
    toast.error("File size must be less than 100MB");
    return;
  }
  
  // Set file and preview
  setValue("imageFile", file, { shouldValidate: true });
  setImagePreview(reader.result as string);
}
```

#### 2. **Connect Wallet**
```typescript
const connectWallet = async () => {
  // Check if MetaMask is installed
  if (!window.ethereum) {
    toast.error("MetaMask is not installed");
    return;
  }
  
  // Check network (must be Polygon Amoy)
  const isOnPolygonAmoy = await isPolygonAmoyNetwork();
  if (!isOnPolygonAmoy) {
    await switchToPolygonAmoy();
  }
  
  // Request account access
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  
  setWalletAddress(accounts[0]);
}
```

#### 3. **Upload to IPFS & Create Database Record**
**File**: `/apps/web/actions/nft.actions.ts`

```typescript
export async function createNFT(
  name: string,
  description: string,
  imageFile: File,
  price: string,
  collectionId: string,
  walletAddress: string,
  // ... other params
) {
  // Step 1: Upload image to IPFS (via Pinata)
  const imageFormData = new FormData();
  imageFormData.append("file", imageFile);
  
  const imageUploadResponse = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PINATA_JWT}`,
      },
      body: imageFormData,
    }
  );
  
  const imageData = await imageUploadResponse.json();
  const imageHash = imageData.IpfsHash;
  
  // Step 2: Create metadata JSON
  const metadata = {
    name,
    description,
    image: `ipfs://${imageHash}`,
    attributes: [],
  };
  
  // Step 3: Upload metadata to IPFS
  const metadataResponse = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: { name: `${name}-metadata` },
      }),
    }
  );
  
  const metadataData = await metadataResponse.json();
  const tokenURI = `ipfs://${metadataData.IpfsHash}`;
  
  // Step 4: Create database record
  const [newNFT] = await db
    .insert(nfts)
    .values({
      name,
      description,
      image: `https://gateway.pinata.cloud/ipfs/${imageHash}`,
      price,
      userId: session.user.id,
      collectionId,
      tokenURI,
      contractAddress,
      ownerAddress: walletAddress,
      // blockchain info will be added after mint
    })
    .returning();
  
  return { success: true, nftId: newNFT.id, tokenURI };
}
```

#### 4. **Mint on Blockchain**
**File**: `/apps/web/lib/blockchain.ts`

```typescript
export async function mintNFT(
  to: string,
  tokenURI: string,
): Promise<{
  success: boolean;
  transactionHash?: string;
  tokenId?: bigint;
  blockNumber?: bigint;
  blockHash?: string;
  error?: string;
}> {
  // Get wallet client
  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();
  
  // Simulate transaction to get tokenId
  const { result: tokenId } = await publicClient.simulateContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: PIXEL_MINT_NFT_ABI,
    functionName: "mint",
    args: [to, tokenURI],
    account,
  });
  
  // Execute mint transaction
  const hash = await walletClient.writeContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: PIXEL_MINT_NFT_ABI,
    functionName: "mint",
    args: [to, tokenURI],
    account,
  });
  
  // Wait for transaction receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return {
    success: true,
    transactionHash: hash,
    tokenId,
    blockNumber: receipt.blockNumber,
    blockHash: receipt.blockHash,
  };
}
```

#### 5. **Update Database with Blockchain Info**
```typescript
// After successful mint
await updateNFTBlockchainInfo(
  nftId,
  tokenId.toString(),
  transactionHash,
  blockNumber,
  blockHash
);
```

#### 6. **Automatic Marketplace Approval (Optional)**
```typescript
// Approve marketplace for all tokens (one-time, ~0.01 POL)
await walletClient.writeContract({
  address: NFT_CONTRACT_ADDRESS,
  abi: PIXEL_MINT_NFT_ABI,
  functionName: "setApprovalForAll",
  args: [MARKETPLACE_CONTRACT_ADDRESS, true],
  account,
});
```

### Minting Flow Diagram

```
┌─────────────┐
│   User      │
│  Uploads    │
│  Artwork    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Upload Image   │
│   to IPFS       │◄── Pinata API
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Create Metadata │
│  Upload to IPFS │◄── Pinata API
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Create Record  │
│  in Database    │◄── PostgreSQL
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Mint NFT on    │
│   Blockchain    │◄── Smart Contract
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Update DB with │
│ Blockchain Info │◄── Transaction Hash,
└─────────────────┘    Token ID, Block #
```

---

## Listing Flow

### Overview
Sellers list NFTs for sale on the marketplace using a **lazy listing** approach (NFT stays with seller).

### Step-by-Step Process

#### 1. **Check if NFT is Already Listed**
**File**: `/apps/web/components/nft/NFTDetailModal.tsx`

```typescript
// Check database first
if (nft.isListed) {
  toast.error("NFT is already listed");
  return;
}
```

#### 2. **Ensure Marketplace Approval**
```typescript
// Check if marketplace is approved
const approvalCheck = await checkNFTApproval(
  tokenId,
  ownerAddress,
  MARKETPLACE_CONTRACT_ADDRESS
);

if (!approvalCheck.isApproved) {
  // Approve marketplace (one-time)
  await walletClient.writeContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: PIXEL_MINT_NFT_ABI,
    functionName: "setApprovalForAll",
    args: [MARKETPLACE_CONTRACT_ADDRESS, true],
    account,
  });
}
```

#### 3. **List on Marketplace Contract**
**File**: `/apps/web/lib/blockchain.ts`

```typescript
export async function listNFT(
  tokenId: bigint,
  price: string, // Price in MATIC
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  const priceInWei = parseEther(price);
  
  // Simulate first to catch errors
  await publicClient.simulateContract({
    address: MARKETPLACE_CONTRACT_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "listNFT",
    args: [NFT_CONTRACT_ADDRESS, tokenId, priceInWei],
    account,
  });
  
  // Execute listing (lazy - NFT stays with seller)
  const hash = await walletClient.writeContract({
    address: MARKETPLACE_CONTRACT_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "listNFT",
    args: [NFT_CONTRACT_ADDRESS, tokenId, priceInWei],
    account,
  });
  
  return { success: true, transactionHash: hash };
}
```

#### 4. **Update Database**
**File**: `/apps/web/actions/nft.actions.ts`

```typescript
export async function listNFTForSale(
  nftId: string,
  price: string
): Promise<{ success: boolean; error?: string }> {
  // Update database
  await db
    .update(nfts)
    .set({
      price,
      isListed: new Date(), // Set listing timestamp
    })
    .where(eq(nfts.id, nftId));
  
  revalidatePath("/");
  return { success: true };
}
```

### Lazy Listing Benefits

**Traditional Escrow**:
- Transfer NFT to marketplace: ~0.05-0.1 POL
- Buyer purchases: ~0.05-0.1 POL
- **Total: ~0.1-0.2 POL**

**Lazy Listing** (Pixel Mint):
- Approve marketplace once: ~0.01 POL (one-time)
- List NFT: ~0.01-0.02 POL
- Buyer purchases (atomic swap): ~0.05-0.1 POL
- **Total: ~0.06-0.12 POL** (40% cheaper!)

---

## Buying Flow

### Overview
Buyers can purchase NFTs through the marketplace using **atomic swaps** (payment + transfer in one transaction).

### Two Purchase Methods

#### Method 1: Marketplace Purchase (Recommended - Atomic Swap)
**Gas Cost**: ~0.05-0.1 POL

```typescript
export async function buyNFT(
  tokenId: bigint,
  sellerAddress: string,
  price: string,
) {
  // Check if listed on marketplace
  const listing = await publicClient.readContract({
    address: MARKETPLACE_CONTRACT_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "getListing",
    args: [NFT_CONTRACT_ADDRESS, tokenId],
  });
  
  if (listing.isActive) {
    // Use marketplace contract (ATOMIC SWAP)
    const hash = await walletClient.writeContract({
      address: MARKETPLACE_CONTRACT_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "buyNFT",
      args: [NFT_CONTRACT_ADDRESS, tokenId],
      value: priceInWei,
      account,
    });
    
    // Payment + transfer happen in ONE transaction!
    return { success: true, transactionHash: hash };
  }
}
```

**What happens in the smart contract**:
```solidity
function buyNFT(address nftContract, uint256 tokenId) 
    external payable nonReentrant {
    Listing storage listing = listings[nftContract][tokenId];
    
    // 1. Verify listing is active
    require(listing.isActive, "NFT is not listed");
    
    // 2. Verify payment is sufficient
    require(msg.value >= listing.price, "Insufficient payment");
    
    // 3. Calculate fees
    uint256 fee = (listing.price * marketplaceFee) / 10000;
    uint256 sellerAmount = listing.price - fee;
    
    // 4. Mark as inactive
    listing.isActive = false;
    
    // 5. ATOMIC: Transfer NFT from seller to buyer
    nft.safeTransferFrom(listing.seller, msg.sender, tokenId);
    
    // 6. Transfer payment to seller
    payable(listing.seller).call{value: sellerAmount}("");
    
    // 7. Refund excess payment
    if (msg.value > listing.price) {
        payable(msg.sender).call{value: msg.value - listing.price}("");
    }
}
```

#### Method 2: Direct Transfer (Fallback)
**Gas Cost**: ~0.01 POL (payment) + seller must transfer manually

```typescript
// Step 1: Send payment to seller
const paymentHash = await walletClient.sendTransaction({
  to: sellerAddress,
  value: priceInWei,
  account,
});

// Step 2: Seller transfers NFT manually (or auto if approved)
if (buyerIsApproved) {
  const transferHash = await walletClient.writeContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: PIXEL_MINT_NFT_ABI,
    functionName: "safeTransferFrom",
    args: [sellerAddress, buyerAddress, tokenId],
    account,
  });
}
```

### Database Update After Purchase

**File**: `/apps/web/actions/nft.actions.ts`

```typescript
export async function purchaseNFT(
  nftId: string,
  buyerAddress: string,
  transactionHash: string,
  transferHash?: string,
  blockNumber?: bigint,
  blockHash?: string
): Promise<{ success: boolean; error?: string }> {
  // Get current NFT
  const [nft] = await db
    .select()
    .from(nfts)
    .where(eq(nfts.id, nftId));
  
  // Create transaction record
  await db.insert(nftTransactions).values({
    nftId,
    from: nft.ownerAddress,
    to: buyerAddress,
    price: nft.price,
    transactionHash,
    transferHash,
    blockNumber: blockNumber?.toString(),
    blockHash,
    type: "sale",
  });
  
  // Update NFT ownership and remove listing
  await db
    .update(nfts)
    .set({
      ownerAddress: buyerAddress,
      userId: buyerUserId, // Update owner in DB
      isListed: null, // Remove from marketplace
      price: nft.price, // Keep last sale price
    })
    .where(eq(nfts.id, nftId));
  
  return { success: true };
}
```

### Buying Flow Diagram

```
┌─────────────┐
│   Buyer     │
│ Clicks Buy  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Connect Wallet &    │
│ Check Network       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Verify Ownership   │
│  on Blockchain      │◄── Smart Contract
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Check if Listed   │
│  on Marketplace     │◄── Smart Contract
└──────┬──────────────┘
       │
       ├── Yes (Marketplace Listing)
       │   │
       │   ▼
       │   ┌─────────────────────┐
       │   │  Execute buyNFT()   │
       │   │  (Atomic Swap)      │◄── Payment + Transfer
       │   └──────┬──────────────┘      in ONE transaction
       │          │
       │          ▼
       │   ┌─────────────────────┐
       │   │ Wait for Receipt    │
       │   └──────┬──────────────┘
       │          │
       └──────────┼──────────────┐
                  │              │
                  ▼              │
       ┌─────────────────────┐  │
       │  Update Database    │  │
       │  with Transaction   │  │
       └──────┬──────────────┘  │
              │                 │
              ▼                 │
       ┌─────────────────────┐ │
       │  Transfer Ownership │ │
       │  in Database        │ │
       └──────┬──────────────┘ │
              │                 │
              ▼                 ▼
       ┌─────────────────────────┐
       │  Purchase Complete!     │
       └─────────────────────────┘
```

---

## Selling/Delisting Flow

### Delist from Marketplace

#### 1. **Remove from Marketplace Contract**
```typescript
export async function delistNFT(
  tokenId: bigint
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  const hash = await walletClient.writeContract({
    address: MARKETPLACE_CONTRACT_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "delistNFT",
    args: [NFT_CONTRACT_ADDRESS, tokenId],
    account,
  });
  
  return { success: true, transactionHash: hash };
}
```

**Smart Contract**:
```solidity
function delistNFT(address nftContract, uint256 tokenId) 
    external nonReentrant {
    Listing storage listing = listings[nftContract][tokenId];
    
    // Only seller can delist
    require(listing.seller == msg.sender, "Only seller can delist");
    
    // Mark as inactive
    listing.isActive = false;
    
    // NFT stays with seller (was never transferred in lazy listing)
    emit NFTDelisted(nftContract, tokenId, msg.sender, block.timestamp);
}
```

#### 2. **Update Database**
```typescript
await db
  .update(nfts)
  .set({ isListed: null })
  .where(eq(nfts.id, nftId));
```

### Transfer NFT Manually

```typescript
export async function transferNFT(
  tokenId: bigint,
  to: string,
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  // Verify ownership
  const ownerCheck = await getNFTOwnerOnChain(tokenId);
  if (ownerCheck.owner !== account) {
    return { success: false, error: "You don't own this NFT" };
  }
  
  // Transfer NFT
  const hash = await walletClient.writeContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: PIXEL_MINT_NFT_ABI,
    functionName: "safeTransferFrom",
    args: [account, to, tokenId],
    account,
  });
  
  return { success: true, transactionHash: hash };
}
```

---

## Technology Stack

### Blockchain Layer
- **Network**: Polygon Amoy Testnet (Chain ID: 80002)
- **RPC Provider**: Alchemy (with fallback to public RPC)
- **Smart Contract Framework**: Hardhat + OpenZeppelin
- **Language**: Solidity ^0.8.24

### Frontend Blockchain Integration
- **Library**: Viem (modern web3 library)
- **Wallet**: MetaMask (via window.ethereum)
- **Type Safety**: TypeScript + Viem types

### Storage
- **Metadata**: IPFS via Pinata
- **Database**: PostgreSQL (Drizzle ORM)
- **Images**: IPFS with Pinata gateway

### Key Libraries

```json
{
  "viem": "^2.x", // Blockchain interactions
  "wagmi": "^2.x", // React hooks for web3
  "@openzeppelin/contracts": "^5.x", // Smart contract standards
  "hardhat": "^2.x", // Development environment
  "drizzle-orm": "^0.x", // Database ORM
}
```

---

## Gas Optimization

### 1. Lazy Listing
**Instead of**:
```solidity
// Traditional: Transfer to escrow (~0.05 POL)
nft.safeTransferFrom(seller, address(this), tokenId);
```

**We use**:
```solidity
// Lazy: Just require approval (~0.01 POL one-time)
require(
  nft.isApprovedForAll(msg.sender, address(this)),
  "Marketplace must be approved"
);
```

**Savings**: ~60% on listing costs

### 2. Atomic Swaps
**Instead of**:
```javascript
// Step 1: Buyer sends payment
await sendTransaction({ to: seller, value: price });
// Step 2: Seller transfers NFT (manual)
await transferNFT(tokenId, buyer);
```

**We use**:
```solidity
// ONE transaction does both (atomic)
function buyNFT() external payable {
  nft.safeTransferFrom(seller, buyer, tokenId);
  payable(seller).call{value: price}("");
}
```

**Benefits**:
- Eliminates trust requirement
- Prevents payment without transfer
- Prevents transfer without payment
- Saves one transaction fee

### 3. No Array Storage
**Instead of**:
```solidity
// Expensive: Loop through all listings
Listing[] public allListings;
```

**We use**:
```solidity
// Cheap: Direct mapping lookup
mapping(address => mapping(uint256 => Listing)) public listings;
```

**Savings**: 20-30% on listing/delisting

### 4. ReentrancyGuard
Prevents expensive attack vectors:
```solidity
modifier nonReentrant() {
  require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
  _status = _ENTERED;
  _;
  _status = _NOT_ENTERED;
}
```

### Gas Cost Summary

| Operation | Gas Cost (POL) | Details |
|-----------|----------------|---------|
| Mint NFT | ~0.02-0.05 | Includes tokenURI storage |
| Approve Marketplace | ~0.01 | One-time per wallet |
| List NFT | ~0.01-0.02 | Lazy listing |
| Delist NFT | ~0.01 | Simple state update |
| Buy NFT | ~0.05-0.1 | Atomic swap |
| Transfer NFT | ~0.02-0.03 | Direct transfer |

---

## Error Handling

### Blockchain Error Types

#### 1. **User Rejection**
```typescript
if (error.code === 4001) {
  return { success: false, error: "User rejected the transaction" };
}
```

#### 2. **Contract Revert**
```typescript
if (error.message.includes("execution reverted")) {
  // Extract revert reason
  const reason = extractRevertReason(error.data);
  return { success: false, error: reason };
}
```

#### 3. **RPC Errors**
```typescript
// Retry logic for network issues
let attempts = 0;
while (attempts < 3) {
  try {
    const hash = await walletClient.writeContract(...);
    break;
  } catch (error) {
    if (error.message.includes("Internal JSON-RPC error")) {
      await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
      attempts++;
      continue;
    }
    throw error;
  }
}
```

#### 4. **Insufficient Gas**
```typescript
try {
  await publicClient.estimateContractGas({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "mint",
    args: [to, tokenURI],
    account,
  });
} catch (gasError) {
  return { 
    success: false, 
    error: "Insufficient gas. Please ensure you have enough MATIC." 
  };
}
```

### Database Sync Errors

```typescript
// If blockchain succeeds but database fails
try {
  const mintResult = await mintNFT(wallet, tokenURI);
  if (mintResult.success) {
    try {
      await updateDatabase(mintResult);
    } catch (dbError) {
      // Log for manual recovery
      console.error("DB sync failed:", {
        transactionHash: mintResult.transactionHash,
        tokenId: mintResult.tokenId,
        error: dbError
      });
      
      // Still return success - NFT is minted
      return { 
        success: true, 
        warning: "NFT minted but database update failed" 
      };
    }
  }
} catch (error) {
  // Blockchain failed
  return { success: false, error: error.message };
}
```

---

## Security Considerations

### 1. **Ownership Verification**

**Always verify on blockchain** (source of truth):
```typescript
// DON'T: Trust database alone
const owner = nft.ownerAddress; // Database could be outdated

// DO: Verify on blockchain
const { owner } = await getNFTOwnerOnChain(tokenId);
if (owner !== expectedOwner) {
  return { success: false, error: "Ownership mismatch" };
}
```

### 2. **Reentrancy Protection**

All state-changing functions use `nonReentrant`:
```solidity
function buyNFT(address nftContract, uint256 tokenId) 
    external payable nonReentrant {
    // State changes happen atomically
    listing.isActive = false;
    nft.safeTransferFrom(seller, buyer, tokenId);
    payable(seller).call{value: price}("");
}
```

### 3. **Approval Checks**

Before listing/buying, verify approvals:
```typescript
const isApproved = await publicClient.readContract({
  address: NFT_CONTRACT_ADDRESS,
  abi: PIXEL_MINT_NFT_ABI,
  functionName: "isApprovedForAll",
  args: [seller, MARKETPLACE_CONTRACT_ADDRESS],
});

if (!isApproved) {
  return { 
    success: false, 
    error: "Marketplace not approved. Please approve first." 
  };
}
```

### 4. **Price Validation**

```solidity
require(price > 0, "Price must be greater than 0");
require(msg.value >= listing.price, "Insufficient payment");
```

### 5. **Zero Address Checks**

```solidity
require(to != address(0), "Cannot mint to zero address");
require(nftContract != address(0), "Invalid NFT contract");
```

### 6. **Transaction Simulation**

Always simulate before executing:
```typescript
// Simulate first
await publicClient.simulateContract({
  address: CONTRACT_ADDRESS,
  abi: ABI,
  functionName: "mint",
  args: [to, tokenURI],
  account,
});

// Then execute
const hash = await walletClient.writeContract({...});
```

### 7. **Emergency Functions**

Marketplace contract has emergency withdrawal:
```solidity
function emergencyWithdraw(
    address nftContract,
    uint256 tokenId,
    address to
) external onlyOwner {
    IERC721(nftContract).safeTransferFrom(address(this), to, tokenId);
}
```

---

## Best Practices

### For Developers

1. **Always Simulate First**
   ```typescript
   // Catch errors before user signs
   await publicClient.simulateContract({...});
   await walletClient.writeContract({...});
   ```

2. **Use TypeScript**
   ```typescript
   // Viem provides excellent TypeScript support
   const result = await publicClient.readContract({
     address: CONTRACT_ADDRESS as `0x${string}`,
     abi: ABI,
     functionName: "tokenURI",
     args: [tokenId],
   });
   // result is typed correctly!
   ```

3. **Handle All Error Cases**
   - User rejection
   - Network errors
   - Contract reverts
   - RPC failures
   - Gas estimation failures

4. **Keep Database in Sync**
   ```typescript
   // 1. Execute blockchain transaction
   const result = await mintNFT(wallet, tokenURI);
   
   // 2. Update database with blockchain data
   if (result.success) {
     await updateNFTBlockchainInfo(
       nftId,
       result.tokenId,
       result.transactionHash,
       result.blockNumber
     );
   }
   ```

5. **Use Retry Logic for RPC Errors**
   ```typescript
   let attempts = 0;
   while (attempts < 3) {
     try {
       return await executeTransaction();
     } catch (error) {
       if (isRPCError(error) && attempts < 2) {
         await sleep(1000 * attempts);
         attempts++;
         continue;
       }
       throw error;
     }
   }
   ```

### For Users

1. **Always Verify Ownership**
   - Check blockchain explorer (PolygonScan)
   - Verify tokenId and contract address
   - Confirm ownership before buying

2. **Check Network**
   - Ensure you're on Polygon Amoy
   - Have enough MATIC for gas

3. **Approve Carefully**
   - `setApprovalForAll` is powerful
   - Only approve trusted contracts
   - Review marketplace contract code

4. **Monitor Transactions**
   - Save transaction hashes
   - Wait for confirmations
   - Check final state on blockchain

---

## Troubleshooting

### Common Issues

#### "Marketplace must be approved"
**Solution**: Call `setApprovalForAll` first
```typescript
await walletClient.writeContract({
  address: NFT_CONTRACT_ADDRESS,
  abi: PIXEL_MINT_NFT_ABI,
  functionName: "setApprovalForAll",
  args: [MARKETPLACE_CONTRACT_ADDRESS, true],
  account,
});
```

#### "NFT is not listed"
**Cause**: Listing expired or was removed
**Solution**: Check listing status before buying
```typescript
const listing = await getListing(NFT_CONTRACT_ADDRESS, tokenId);
if (!listing.isActive) {
  toast.error("This NFT is no longer listed");
}
```

#### "Insufficient payment"
**Cause**: Price in wei is less than listing price
**Solution**: Ensure correct price conversion
```typescript
const priceInWei = parseEther(price); // "0.1" => 100000000000000000n
```

#### "Transaction underpriced"
**Cause**: Gas price too low
**Solution**: Wait for network to be less congested or increase gas

#### "Nonce too low"
**Cause**: Transaction already processed
**Solution**: Refresh page and try again

---

## Deployment

### Smart Contract Deployment

**File**: `/contracts/scripts/deploy.ts`

```typescript
async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Deploy NFT contract
  const PixelMintNFT = await ethers.getContractFactory("PixelMintNFT");
  const nft = await PixelMintNFT.deploy(
    deployer.address,
    "PixelMint",
    "PMNT"
  );
  await nft.waitForDeployment();
  
  // Deploy Marketplace
  const Marketplace = await ethers.getContractFactory("PixelMintMarketplace");
  const marketplace = await Marketplace.deploy(deployer.address);
  await marketplace.waitForDeployment();
  
  console.log("NFT Contract:", await nft.getAddress());
  console.log("Marketplace:", await marketplace.getAddress());
}
```

### Environment Variables

```env
# Blockchain
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/...

# IPFS
PINATA_JWT=your_pinata_jwt
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret

# Database
DATABASE_URL=postgresql://...
```

---

## Conclusion

Pixel Mint's blockchain architecture provides:

✅ **Decentralized Ownership**: True ownership on blockchain  
✅ **Gas Efficient**: Lazy listing + atomic swaps  
✅ **Secure**: ReentrancyGuard + ownership verification  
✅ **User-Friendly**: Automatic approvals + clear error messages  
✅ **Scalable**: Hybrid database + blockchain approach  

The system balances **decentralization** (blockchain ownership) with **performance** (database queries) and **cost efficiency** (optimized smart contracts) to deliver a production-ready NFT marketplace.
