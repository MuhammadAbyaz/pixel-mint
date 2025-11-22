// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PixelMintNFT
 * @dev ERC-721 NFT contract for Pixel Mint marketplace
 * Supports minting with IPFS tokenURI and ownership management
 */
contract PixelMintNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;
    uint256 public constant MAX_SUPPLY = 1000000; // Maximum number of NFTs that can be minted
    
    // Mapping from token ID to creator address
    mapping(uint256 => address) public creators;
    
    // Mapping from token ID to mint timestamp
    mapping(uint256 => uint256) public mintTimestamps;
    
    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed to,
        address indexed creator,
        string tokenURI,
        uint256 timestamp
    );

    constructor(
        address initialOwner,
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(initialOwner) {
        _tokenIdCounter = 1; // Start token IDs from 1
    }

    /**
     * @dev Mint a new NFT to the specified address with IPFS tokenURI
     * @param to The address to mint the NFT to
     * @param tokenURI The IPFS URI (ipfs://...) for the NFT metadata
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to, string memory tokenURI) 
        public 
        nonReentrant 
        returns (uint256) 
    {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");
        require(_tokenIdCounter <= MAX_SUPPLY, "Maximum supply reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        creators[tokenId] = msg.sender;
        mintTimestamps[tokenId] = block.timestamp;
        
        emit NFTMinted(tokenId, to, msg.sender, tokenURI, block.timestamp);
        
        return tokenId;
    }

    /**
     * @dev Batch mint multiple NFTs
     * @param to The address to mint the NFTs to
     * @param tokenURIs Array of IPFS URIs for the NFTs
     * @return tokenIds Array of minted token IDs
     */
    function batchMint(address to, string[] memory tokenURIs) 
        public 
        nonReentrant 
        returns (uint256[] memory) 
    {
        require(to != address(0), "Cannot mint to zero address");
        require(tokenURIs.length > 0, "Must provide at least one token URI");
        require(
            _tokenIdCounter + tokenURIs.length - 1 <= MAX_SUPPLY,
            "Batch mint would exceed maximum supply"
        );
        
        uint256[] memory tokenIds = new uint256[](tokenURIs.length);
        
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            require(bytes(tokenURIs[i]).length > 0, "Token URI cannot be empty");
            
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            
            creators[tokenId] = msg.sender;
            mintTimestamps[tokenId] = block.timestamp;
            
            tokenIds[i] = tokenId;
            
            emit NFTMinted(tokenId, to, msg.sender, tokenURIs[i], block.timestamp);
        }
        
        return tokenIds;
    }

    /**
     * @dev Get the creator of a token
     * @param tokenId The token ID
     * @return The address of the creator
     */
    function getCreator(uint256 tokenId) public view returns (address) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return creators[tokenId];
    }

    /**
     * @dev Get the mint timestamp of a token
     * @param tokenId The token ID
     * @return The timestamp when the token was minted
     */
    function getMintTimestamp(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return mintTimestamps[tokenId];
    }

    /**
     * @dev Get the current token ID counter
     * @return The next token ID that will be minted
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Override to prevent transfers to zero address
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        require(to != address(0), "Cannot transfer to zero address");
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Check if token exists
     * @param tokenId The token ID to check
     * @return Whether the token exists
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}

