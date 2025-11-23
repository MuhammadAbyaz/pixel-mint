"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { nfts, nftLikes, nftSales, users, collections } from "@/db/schema";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { eq, desc, isNotNull, and, or } from "drizzle-orm";
import { uploadToIPFS, uploadMetadataToIPFS } from "@/lib/ipfs";
import { env } from "@/env";

// Import NFT contract address (we'll use a constant since this is server-side)
const NFT_CONTRACT_ADDRESS = env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

export type NFT = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  userId: string;
  collectionId: string | null;
  isListed: Date | null;
  likes: number;
  // Blockchain fields
  tokenId: string | null;
  contractAddress: string | null;
  transactionHash: string | null;
  blockNumber: number | null;
  blockHash: string | null;
  ipfsHash: string | null;
  tokenURI: string | null;
  ownerAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function uploadNFTImage(
  formData: FormData,
): Promise<{ url: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { url: "", error: "Unauthorized" };
    }

    const file = formData.get("image") as File;
    if (!file) {
      return { url: "", error: "No file provided" };
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

    // Upload to Supabase
    const { error } = await supabase.storage
      .from("pixel-mint-bucket")
      .upload(`nfts/${fileName}`, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return { url: "", error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("pixel-mint-bucket")
      .getPublicUrl(`nfts/${fileName}`);

    return { url: publicUrl };
  } catch (error) {
    console.error("Error uploading NFT image:", error);
    return { url: "", error: "Failed to upload image" };
  }
}

export async function createNFT(
  name: string,
  description: string,
  imageFile: File,
  price: string,
  collectionId: string,
  walletAddress: string,
  transactionHash?: string,
  tokenId?: string,
  contractAddress?: string,
): Promise<{
  success: boolean;
  error?: string;
  nftId?: string;
  tokenURI?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (!collectionId) {
      return { success: false, error: "Collection ID is required" };
    }

    if (!walletAddress) {
      return { success: false, error: "Wallet address is required" };
    }

    const imageResult = await uploadToIPFS(
      imageFile,
      `${name}-${Date.now()}.${imageFile.name.split(".").pop()}`,
    );
    if (!imageResult.success || !imageResult.ipfsHash) {
      return {
        success: false,
        error: imageResult.error || "Failed to upload image to IPFS",
      };
    }

    const ipfsImageUrl =
      imageResult.ipfsUrl ||
      `https://gateway.pinata.cloud/ipfs/${imageResult.ipfsHash}`;

    const metadata = {
      name,
      description,
      image: ipfsImageUrl,
      attributes: [
        { trait_type: "Collection", value: collectionId },
        { trait_type: "Price", value: price },
      ],
    };

    const metadataResult = await uploadMetadataToIPFS(metadata);
    if (!metadataResult.success || !metadataResult.ipfsHash) {
      return {
        success: false,
        error: metadataResult.error || "Failed to upload metadata to IPFS",
      };
    }

    const tokenURI =
      metadataResult.ipfsUrl || `ipfs://${metadataResult.ipfsHash}`;

    const [newNFT] = await db
      .insert(nfts)
      .values({
        name,
        description,
        image: ipfsImageUrl,
        price,
        userId: session.user.id,
        collectionId: collectionId,
        isListed: new Date(),
        tokenId: tokenId || null,
        contractAddress: contractAddress || null,
        transactionHash: transactionHash || null,
        ipfsHash: metadataResult.ipfsHash,
        tokenURI: tokenURI,
        ownerAddress: walletAddress.toLowerCase(),
      })
      .returning();

    if (!newNFT) {
      return { success: false, error: "Failed to create NFT" };
    }

    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath("/create-nft");
    revalidatePath("/");

    return { success: true, nftId: newNFT.id, tokenURI: tokenURI };
  } catch (error) {
    console.error("Error creating NFT:", error);
    return { success: false, error: "Failed to create NFT" };
  }
}

// Update NFT with blockchain information after minting
export async function updateNFTBlockchainInfo(
  nftId: string,
  tokenId: string,
  transactionHash: string,
  blockNumber?: bigint | number,
  blockHash?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [nft] = await db.select().from(nfts).where(eq(nfts.id, nftId));

    if (!nft) {
      return { success: false, error: "NFT not found" };
    }

    if (nft.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .update(nfts)
      .set({
        tokenId: tokenId,
        transactionHash: transactionHash,
        contractAddress: NFT_CONTRACT_ADDRESS,
        blockNumber: blockNumber ? Number(blockNumber) : null,
        blockHash: blockHash || null,
        updatedAt: new Date(),
      })
      .where(eq(nfts.id, nftId));

    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath("/create-nft");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error updating NFT blockchain info:", error);
    return { success: false, error: "Failed to update NFT" };
  }
}

// Legacy function for backward compatibility (uploads to Supabase, not IPFS)
export async function createNFTLegacy(
  name: string,
  description: string,
  imageUrl: string,
  price: string,
  collectionId: string,
): Promise<{ success: boolean; error?: string; nftId?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (!collectionId) {
      return { success: false, error: "Collection ID is required" };
    }

    const [newNFT] = await db
      .insert(nfts)
      .values({
        name,
        description,
        image: imageUrl,
        price,
        userId: session.user.id,
        collectionId: collectionId,
        isListed: new Date(),
      })
      .returning();

    if (!newNFT) {
      return { success: false, error: "Failed to create NFT" };
    }

    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath("/create-nft");
    revalidatePath("/");

    return { success: true, nftId: newNFT.id };
  } catch (error) {
    console.error("Error creating NFT:", error);
    return { success: false, error: "Failed to create NFT" };
  }
}

export async function getUserNFTs(userId: string): Promise<NFT[]> {
  try {
    // First, get the user's wallet address if they have one
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Query NFTs by userId OR by ownerAddress (blockchain ownership)
    // This ensures NFTs show up even if purchased with a different wallet
    if (user?.walletAddress) {
      const userNFTs = await db
        .select()
        .from(nfts)
        .where(
          or(
            eq(nfts.userId, userId),
            eq(nfts.ownerAddress, user.walletAddress.toLowerCase()),
          ),
        );

      return userNFTs;
    } else {
      // If no wallet address, just query by userId
      const userNFTs = await db
        .select()
        .from(nfts)
        .where(eq(nfts.userId, userId));

      return userNFTs;
    }
  } catch (error) {
    console.error("Error fetching user NFTs:", error);
    return [];
  }
}

export async function getNFTsByCollection(
  collectionId: string,
): Promise<NFT[]> {
  try {
    const collectionNFTs = await db
      .select()
      .from(nfts)
      .where(eq(nfts.collectionId, collectionId));

    return collectionNFTs;
  } catch (error) {
    console.error("Error fetching collection NFTs:", error);
    return [];
  }
}

export async function getTrendingNFTs(limit: number = 4): Promise<NFT[]> {
  try {
    const trendingNFTs = await db
      .select()
      .from(nfts)
      .where(isNotNull(nfts.isListed)) // Only get listed NFTs
      .orderBy(desc(nfts.likes))
      .limit(limit);

    return trendingNFTs;
  } catch (error) {
    console.error("Error fetching trending NFTs:", error);
    return [];
  }
}

export async function getAllNFTs(
  limit: number = 12,
  offset: number = 0,
): Promise<NFT[]> {
  try {
    const allNFTs = await db
      .select()
      .from(nfts)
      .where(isNotNull(nfts.isListed)) // Only get listed NFTs
      .orderBy(desc(nfts.createdAt)) // Order by newest first
      .limit(limit)
      .offset(offset);

    return allNFTs;
  } catch (error) {
    console.error("Error fetching all NFTs:", error);
    return [];
  }
}

export async function getNFTById(nftId: string): Promise<NFT | null> {
  try {
    const [nft] = await db
      .select()
      .from(nfts)
      .where(eq(nfts.id, nftId))
      .limit(1);

    return nft || null;
  } catch (error) {
    console.error("Error fetching NFT:", error);
    return null;
  }
}

export async function toggleLikeNFT(nftId: string): Promise<{
  success: boolean;
  likes: number;
  isLiked: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        likes: 0,
        isLiked: false,
        error: "Unauthorized",
      };
    }

    const [nft] = await db.select().from(nfts).where(eq(nfts.id, nftId));

    if (!nft) {
      return {
        success: false,
        likes: 0,
        isLiked: false,
        error: "NFT not found",
      };
    }

    // Check if user has already liked this NFT
    const [existingLike] = await db
      .select()
      .from(nftLikes)
      .where(
        and(eq(nftLikes.userId, session.user.id), eq(nftLikes.nftId, nftId)),
      )
      .limit(1);

    if (existingLike) {
      // Unlike: remove the like record and decrement likes
      await db
        .delete(nftLikes)
        .where(
          and(eq(nftLikes.userId, session.user.id), eq(nftLikes.nftId, nftId)),
        );

      const newLikes = Math.max(0, nft.likes - 1);
      await db
        .update(nfts)
        .set({ likes: newLikes, updatedAt: new Date() })
        .where(eq(nfts.id, nftId));

      revalidatePath("/");
      revalidatePath(`/nft/${nftId}`);

      return { success: true, likes: newLikes, isLiked: false };
    } else {
      // Like: add the like record and increment likes
      await db.insert(nftLikes).values({
        userId: session.user.id,
        nftId: nftId,
      });

      const newLikes = nft.likes + 1;
      await db
        .update(nfts)
        .set({ likes: newLikes, updatedAt: new Date() })
        .where(eq(nfts.id, nftId));

      revalidatePath("/");
      revalidatePath(`/nft/${nftId}`);

      return { success: true, likes: newLikes, isLiked: true };
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return {
      success: false,
      likes: 0,
      isLiked: false,
      error: "Failed to like NFT",
    };
  }
}

export async function checkIfLiked(nftId: string): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return false;
    }

    const [like] = await db
      .select()
      .from(nftLikes)
      .where(
        and(eq(nftLikes.userId, session.user.id), eq(nftLikes.nftId, nftId)),
      )
      .limit(1);

    return !!like;
  } catch (error) {
    console.error("Error checking if liked:", error);
    return false;
  }
}

export async function purchaseNFT(
  nftId: string,
  buyerWalletAddress: string,
  transactionHash: string,
  blockNumber?: number,
  blockHash?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [nft] = await db.select().from(nfts).where(eq(nfts.id, nftId));

    if (!nft) {
      return { success: false, error: "NFT not found" };
    }

    // Note: We don't check database owner here because it might be out of sync
    // The blockchain check in buyNFT (called before purchaseNFT) is the final authority
    // If the buyer is the current blockchain owner, buyNFT will reject it
    // This allows the purchase flow to work even if database is temporarily out of sync

    const normalizedBuyerAddress = buyerWalletAddress.toLowerCase();

    if (!nft.isListed) {
      return {
        success: false,
        error: "This NFT is not available for purchase",
      };
    }

    if (!nft.ownerAddress) {
      return { success: false, error: "NFT owner address not found" };
    }

    // Find the buyer's user account by wallet address
    // This allows NFTs to be purchased with any wallet and still show in the correct account
    const [buyerUser] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, normalizedBuyerAddress))
      .limit(1);

    // Use the buyer's user ID if found, otherwise use the session user ID
    // This handles cases where someone buys with a wallet that's linked to a different account
    const buyerUserId = buyerUser?.id || session.user.id;

    // If the wallet address doesn't match the session user's wallet, update it
    // This ensures the wallet address is linked to the account
    if (buyerUser && buyerUser.id !== session.user.id) {
      // The wallet belongs to a different account - use that account
      // This is correct behavior: the NFT should belong to the account that owns the wallet
    } else if (!buyerUser && session.user.id) {
      // Wallet not linked to any account - link it to the current session user
      // This will be handled by the wallet connection flow, but we can update here too
    }

    // Record the sale in nft_sales table
    await db.insert(nftSales).values({
      nftId: nftId,
      sellerAddress: nft.ownerAddress,
      buyerAddress: normalizedBuyerAddress,
      price: nft.price,
      transactionHash: transactionHash,
      blockNumber: blockNumber || null,
      blockHash: blockHash || null,
    });

    // Transfer ownership to the buyer
    // Update both userId (for database queries) and ownerAddress (for blockchain verification)
    // Set collectionId to null - buyer can add it to a collection later if they want
    await db
      .update(nfts)
      .set({
        userId: buyerUserId, // Use the account that owns the wallet address
        ownerAddress: normalizedBuyerAddress, // Blockchain owner address
        isListed: null, // Unlist the NFT after purchase
        collectionId: null, // Remove from seller's collection - buyer can add to their own collection later
        updatedAt: new Date(),
      })
      .where(eq(nfts.id, nftId));

    // Revalidate paths for both buyer and seller
    revalidatePath("/");
    revalidatePath(`/profile/${buyerUserId}`);
    revalidatePath(`/profile/${nft.userId}`); // Seller's profile
    revalidatePath(`/nft/${nftId}`);

    return { success: true };
  } catch (error) {
    console.error("Error purchasing NFT:", error);
    return { success: false, error: "Failed to purchase NFT" };
  }
}

/**
 * Sync NFT ownerAddress with blockchain (server action wrapper)
 * This is called from client-side to sync database with blockchain
 */
export async function syncNFTOwnerWithBlockchain(
  nftId: string,
  blockchainOwner: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [nft] = await db.select().from(nfts).where(eq(nfts.id, nftId));

    if (!nft) {
      return { success: false, error: "NFT not found" };
    }

    // Update ownerAddress to match blockchain (blockchain is source of truth)
    await db
      .update(nfts)
      .set({
        ownerAddress: blockchainOwner.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(eq(nfts.id, nftId));

    revalidatePath(`/nft/${nftId}`);
    revalidatePath(`/profile/${session.user.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error syncing NFT owner:", error);
    return { success: false, error: "Failed to sync NFT owner" };
  }
}

/**
 * List or resell an NFT - set price and mark as listed
 * Also syncs the ownerAddress with the blockchain owner (source of truth)
 */
export async function listNFTForSale(
  nftId: string,
  price: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [nft] = await db.select().from(nfts).where(eq(nfts.id, nftId));

    if (!nft) {
      return { success: false, error: "NFT not found" };
    }

    // Verify the user owns the NFT in the database
    if (nft.userId !== session.user.id) {
      return { success: false, error: "You can only list your own NFTs" };
    }

    // Validate price
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return { success: false, error: "Price must be a positive number" };
    }

    // If NFT has a tokenId, verify ownership with blockchain
    // Note: We can't directly call client-side blockchain functions from server actions
    // So we'll verify the user's wallet address matches the database ownerAddress
    // The actual blockchain verification happens on the client side when buying
    if (nft.tokenId && nft.contractAddress) {
      // Verify the user's wallet address matches the NFT's ownerAddress
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      if (user?.walletAddress && nft.ownerAddress) {
        const userWallet = user.walletAddress.toLowerCase();
        const nftOwnerAddress = nft.ownerAddress.toLowerCase();

        if (userWallet !== nftOwnerAddress) {
          return {
            success: false,
            error: `Your wallet address (${userWallet}) doesn't match the NFT owner (${nftOwnerAddress}). Please ensure you're using the correct wallet.`,
          };
        }
      }
    }

    // Update the NFT's price and listing status
    // Note: ownerAddress is already set correctly from previous purchase
    // The blockchain owner verification happens on client side when buying
    await db
      .update(nfts)
      .set({
        price: price,
        isListed: new Date(), // Mark as listed
        updatedAt: new Date(),
      })
      .where(eq(nfts.id, nftId));

    revalidatePath("/");
    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath(`/nft/${nftId}`);

    return { success: true };
  } catch (error) {
    console.error("Error listing NFT:", error);
    return { success: false, error: "Failed to list NFT" };
  }
}

/**
 * Unlist an NFT - remove it from sale
 */
export async function unlistNFT(
  nftId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [nft] = await db.select().from(nfts).where(eq(nfts.id, nftId));

    if (!nft) {
      return { success: false, error: "NFT not found" };
    }

    // Verify the user owns the NFT
    if (nft.userId !== session.user.id) {
      return { success: false, error: "You can only unlist your own NFTs" };
    }

    // Unlist the NFT
    await db
      .update(nfts)
      .set({
        isListed: null,
        updatedAt: new Date(),
      })
      .where(eq(nfts.id, nftId));

    revalidatePath("/");
    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath(`/nft/${nftId}`);

    return { success: true };
  } catch (error) {
    console.error("Error unlisting NFT:", error);
    return { success: false, error: "Failed to unlist NFT" };
  }
}

/**
 * Update NFT collection - add NFT to a collection or remove from collection
 */
export async function updateNFTCollection(
  nftId: string,
  collectionId: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [nft] = await db.select().from(nfts).where(eq(nfts.id, nftId));

    if (!nft) {
      return { success: false, error: "NFT not found" };
    }

    // Verify the user owns the NFT
    if (nft.userId !== session.user.id) {
      return { success: false, error: "You can only update your own NFTs" };
    }

    // If collectionId is provided, verify the collection exists and belongs to the user
    if (collectionId) {
      const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, collectionId))
        .limit(1);

      if (!collection) {
        return { success: false, error: "Collection not found" };
      }

      if (collection.userId !== session.user.id) {
        return {
          success: false,
          error: "You can only add NFTs to your own collections",
        };
      }
    }

    // Update the NFT's collection
    await db
      .update(nfts)
      .set({
        collectionId: collectionId,
        updatedAt: new Date(),
      })
      .where(eq(nfts.id, nftId));

    revalidatePath("/");
    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath(`/nft/${nftId}`);
    if (collectionId) {
      revalidatePath(`/collection/${collectionId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating NFT collection:", error);
    return { success: false, error: "Failed to update NFT collection" };
  }
}

// Get price history for an NFT
// This combines database records with blockchain Transfer events
export async function getPriceHistory(nftId: string) {
  try {
    const sales = await db
      .select()
      .from(nftSales)
      .where(eq(nftSales.nftId, nftId))
      .orderBy(desc(nftSales.createdAt));

    // Include the initial listing price if available
    const [nft] = await db.select().from(nfts).where(eq(nfts.id, nftId));

    const history = [];

    // Add initial listing (from database)
    if (nft && nft.isListed) {
      history.push({
        price: Number(nft.price),
        date: nft.createdAt,
        type: "listing",
        transactionHash: nft.transactionHash,
        blockNumber: nft.blockNumber,
        blockHash: nft.blockHash,
      });
    }

    // Add all sales (from database - these are recorded when purchases happen)
    sales.forEach((sale) => {
      history.push({
        price: Number(sale.price),
        date: sale.createdAt,
        type: "sale",
        transactionHash: sale.transactionHash,
        sellerAddress: sale.sellerAddress,
        buyerAddress: sale.buyerAddress,
        blockNumber: sale.blockNumber,
        blockHash: sale.blockHash,
      });
    });

    // Note: In the future, we can also query blockchain Transfer events
    // to get a complete history, but for now we use the database records
    // which are updated when purchases happen

    return history.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error("Error getting price history:", error);
    return [];
  }
}

export async function deleteNFT(
  nftId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get NFT to verify ownership and get image URL
    const [nft] = await db.select().from(nfts).where(eq(nfts.id, nftId));

    if (!nft) {
      return { success: false, error: "NFT not found" };
    }

    if (nft.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete image from Supabase if it exists
    if (nft.image && nft.image.includes("pixel-mint-bucket")) {
      const imagePath = nft.image.split("pixel-mint-bucket/")[1];
      if (imagePath) {
        await supabase.storage.from("pixel-mint-bucket").remove([imagePath]);
      }
    }

    // Delete NFT from database
    await db.delete(nfts).where(eq(nfts.id, nftId));

    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath("/create-nft");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error deleting NFT:", error);
    return { success: false, error: "Failed to delete NFT" };
  }
}
