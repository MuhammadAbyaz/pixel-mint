"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { nfts, nftLikes } from "@/db/schema";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { eq, desc, isNotNull, and } from "drizzle-orm";

export type NFT = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  userId: string;
  collectionId: string;
  isListed: Date | null;
  likes: number;
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
        isListed: new Date(), // Automatically list the NFT
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
    const userNFTs = await db
      .select()
      .from(nfts)
      .where(eq(nfts.userId, userId));

    return userNFTs;
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

export async function toggleLikeNFT(
  nftId: string,
): Promise<{ success: boolean; likes: number; isLiked: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, likes: 0, isLiked: false, error: "Unauthorized" };
    }

    const [nft] = await db.select().from(nfts).where(eq(nfts.id, nftId));

    if (!nft) {
      return { success: false, likes: 0, isLiked: false, error: "NFT not found" };
    }

    // Check if user has already liked this NFT
    const [existingLike] = await db
      .select()
      .from(nftLikes)
      .where(
        and(
          eq(nftLikes.userId, session.user.id),
          eq(nftLikes.nftId, nftId)
        )
      )
      .limit(1);

    if (existingLike) {
      // Unlike: remove the like record and decrement likes
      await db
        .delete(nftLikes)
        .where(
          and(
            eq(nftLikes.userId, session.user.id),
            eq(nftLikes.nftId, nftId)
          )
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
    return { success: false, likes: 0, isLiked: false, error: "Failed to like NFT" };
  }
}

export async function checkIfLiked(
  nftId: string,
): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return false;
    }

    const [like] = await db
      .select()
      .from(nftLikes)
      .where(
        and(
          eq(nftLikes.userId, session.user.id),
          eq(nftLikes.nftId, nftId)
        )
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

    if (nft.userId === session.user.id) {
      return { success: false, error: "You cannot buy your own NFT" };
    }

    if (!nft.isListed) {
      return { success: false, error: "This NFT is not available for purchase" };
    }

    // Transfer ownership to the buyer
    await db
      .update(nfts)
      .set({
        userId: session.user.id,
        isListed: null, // Unlist the NFT after purchase
        updatedAt: new Date(),
      })
      .where(eq(nfts.id, nftId));

    revalidatePath("/");
    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath(`/profile/${nft.userId}`);
    revalidatePath(`/nft/${nftId}`);

    return { success: true };
  } catch (error) {
    console.error("Error purchasing NFT:", error);
    return { success: false, error: "Failed to purchase NFT" };
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
