"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { nfts } from "@/db/schema";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export type NFT = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  userId: string;
  collectionId: string | null;
  isListed: Date | null;
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
  collectionId?: string,
): Promise<{ success: boolean; error?: string; nftId?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [newNFT] = await db
      .insert(nfts)
      .values({
        name,
        description,
        image: imageUrl,
        price,
        userId: session.user.id,
        collectionId: collectionId || null,
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
