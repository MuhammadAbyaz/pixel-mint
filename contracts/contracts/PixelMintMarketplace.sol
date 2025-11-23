// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title PixelMintMarketplace
 * @dev Marketplace contract for buying and selling NFTs
 * Handles listing, delisting, and purchasing NFTs with automatic payment distribution
 */
contract PixelMintMarketplace is ReentrancyGuard, Ownable, IERC721Receiver {
    // Marketplace fee in basis points (1 basis point = 0.01%)
    uint256 public marketplaceFee = 0; // 0% default fee (no fees)
    uint256 public constant MAX_FEE = 1000; // Maximum 10% fee
    
    // Struct to represent a listing
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool isActive;
        uint256 listedAt;
    }
    
    // Mapping from NFT contract address => token ID => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;
    
    // Removed allListings array to save gas (we can query by mapping instead)
    
    // Events
    event NFTListed(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 timestamp
    );
    
    event NFTDelisted(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 timestamp
    );
    
    event NFTSold(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price,
        uint256 fee,
        uint256 timestamp
    );
    
    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);
    
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev List an NFT for sale (lazy listing - NFT stays with seller)
     * @param nftContract The address of the NFT contract
     * @param tokenId The token ID to list
     * @param price The price in wei (native token, e.g., MATIC)
     * @notice This is a gas-efficient listing that doesn't transfer NFT to escrow
     *         Seller must have approved marketplace (setApprovalForAll) for atomic swaps
     */
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(nftContract != address(0), "Invalid NFT contract address");
        
        IERC721 nft = IERC721(nftContract);
        
        // Check if token exists before calling ownerOf (prevents revert on non-existent tokens)
        try nft.ownerOf(tokenId) returns (address owner) {
            require(owner == msg.sender, "You don't own this NFT");
        } catch {
            revert("Token does not exist");
        }
        
        require(!listings[nftContract][tokenId].isActive, "NFT already listed");
        
        // Check if marketplace is approved (required for atomic swaps on purchase)
        // Note: We don't transfer NFT here to save gas - NFT stays with seller
        // Using isApprovedForAll is cheaper than getApproved (one less storage read)
        require(
            nft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace must be approved. Call setApprovalForAll first (one-time, ~0.01 POL)"
        );
        
        // Create listing directly in storage (NFT stays with seller - much cheaper!)
        listings[nftContract][tokenId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            isActive: true,
            listedAt: block.timestamp
        });
        
        emit NFTListed(nftContract, tokenId, msg.sender, price, block.timestamp);
    }

    /**
     * @dev Delist an NFT (cancel listing)
     * @param nftContract The address of the NFT contract
     * @param tokenId The token ID to delist
     * @notice NFT stays with seller, so no transfer needed (gas efficient)
     */
    function delistNFT(address nftContract, uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.isActive, "NFT is not listed");
        require(listing.seller == msg.sender, "Only seller can delist");
        
        listing.isActive = false;
        
        // No transfer needed - NFT already with seller (lazy listing model)
        
        emit NFTDelisted(nftContract, tokenId, msg.sender, block.timestamp);
    }

    /**
     * @dev Buy an NFT (atomic swap - payment + transfer in one transaction)
     * @param nftContract The address of the NFT contract
     * @param tokenId The token ID to buy
     * @notice NFT is transferred from seller to buyer (seller must have approved marketplace)
     */
    function buyNFT(address nftContract, uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.isActive, "NFT is not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Seller cannot buy their own NFT");
        
        IERC721 nft = IERC721(nftContract);
        
        // Verify seller still owns the NFT and marketplace is approved
        // Check if token exists before calling ownerOf (prevents revert on non-existent tokens)
        address currentOwner;
        try nft.ownerOf(tokenId) returns (address owner) {
            currentOwner = owner;
        } catch {
            revert("Token does not exist");
        }
        require(currentOwner == listing.seller, "Seller no longer owns this NFT");
        
        // Using isApprovedForAll is cheaper (one less storage read)
        require(
            nft.isApprovedForAll(listing.seller, address(this)),
            "Marketplace not approved by seller"
        );
        
        // Mark listing as inactive
        listing.isActive = false;
        
        // Calculate fees
        uint256 fee = (listing.price * marketplaceFee) / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        // Atomic swap: Transfer NFT from seller to buyer
        nft.safeTransferFrom(listing.seller, msg.sender, tokenId);
        
        // Transfer payment to seller
        (bool sellerSuccess, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(sellerSuccess, "Failed to transfer payment to seller");
        
        // Refund excess payment if any
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Failed to refund excess payment");
        }
        
        emit NFTSold(
            nftContract,
            tokenId,
            listing.seller,
            msg.sender,
            listing.price,
            fee,
            block.timestamp
        );
    }

    /**
     * @dev Get listing details
     * @param nftContract The address of the NFT contract
     * @param tokenId The token ID
     * @return seller The seller address
     * @return price The listing price
     * @return isActive Whether the listing is active
     * @return listedAt The timestamp when listed
     */
    function getListing(address nftContract, uint256 tokenId)
        external
        view
        returns (
            address seller,
            uint256 price,
            bool isActive,
            uint256 listedAt
        )
    {
        Listing memory listing = listings[nftContract][tokenId];
        return (listing.seller, listing.price, listing.isActive, listing.listedAt);
    }

    /**
     * @dev Update marketplace fee (only owner)
     * @param newFee The new fee in basis points
     */
    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee exceeds maximum");
        uint256 oldFee = marketplaceFee;
        marketplaceFee = newFee;
        emit MarketplaceFeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Withdraw marketplace fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Failed to withdraw fees");
    }

    // Removed getTotalListings to save gas (can query by mapping if needed)

    /**
     * @dev Required by IERC721Receiver to receive NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @dev Emergency function to recover stuck NFTs (only owner)
     * @param nftContract The NFT contract address
     * @param tokenId The token ID
     * @param to The address to send the NFT to
     */
    function emergencyWithdraw(
        address nftContract,
        uint256 tokenId,
        address to
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        IERC721(nftContract).safeTransferFrom(address(this), to, tokenId);
    }
}

