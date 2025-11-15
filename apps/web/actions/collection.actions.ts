"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { collections, nfts } from "@/db/schema";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { eq, sql, desc, isNotNull } from "drizzle-orm";

export type Collection = {
  id: string;
  name: string;
  description: string;
  image: string;
  userId: string;
  categories: string[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function uploadCollectionImage(
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
      .upload(`collections/${fileName}`, buffer, {
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
      .getPublicUrl(`collections/${fileName}`);

    return { url: publicUrl };
  } catch (error) {
    console.error("Error uploading collection image:", error);
    return { url: "", error: "Failed to upload image" };
  }
}

export async function createCollection(
  name: string,
  description: string,
  imageUrl: string,
  categories: string[],
): Promise<{ success: boolean; error?: string; collectionId?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [newCollection] = await db
      .insert(collections)
      .values({
        name,
        description,
        image: imageUrl,
        userId: session.user.id,
        categories: categories.length > 0 ? categories : null,
      })
      .returning();

    if (!newCollection) {
      return { success: false, error: "Failed to create collection" };
    }

    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath("/create-collection");

    return { success: true, collectionId: newCollection.id };
  } catch (error) {
    console.error("Error creating collection:", error);
    return { success: false, error: "Failed to create collection" };
  }
}

export async function getUserCollections(
  userId: string,
): Promise<Collection[]> {
  try {
    const userCollections = await db
      .select()
      .from(collections)
      .where(eq(collections.userId, userId));

    return userCollections;
  } catch (error) {
    console.error("Error fetching user collections:", error);
    return [];
  }
}

export async function getCollectionById(
  collectionId: string,
): Promise<Collection | null> {
  try {
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId));

    return collection || null;
  } catch (error) {
    console.error("Error fetching collection:", error);
    return null;
  }
}

export async function deleteCollection(
  collectionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get collection to verify ownership and get image URL
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId));

    if (!collection) {
      return { success: false, error: "Collection not found" };
    }

    if (collection.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete image from Supabase if it exists
    if (collection.image && collection.image.includes("pixel-mint-bucket")) {
      const imagePath = collection.image.split("pixel-mint-bucket/")[1];
      if (imagePath) {
        await supabase.storage.from("pixel-mint-bucket").remove([imagePath]);
      }
    }

    // Delete collection from database
    await db.delete(collections).where(eq(collections.id, collectionId));

    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath("/create-collection");

    return { success: true };
  } catch (error) {
    console.error("Error deleting collection:", error);
    return { success: false, error: "Failed to delete collection" };
  }
}

export type TrendingCollection = Collection & {
  totalLikes: number;
};

export async function getTrendingCollections(
  limit: number = 4,
): Promise<TrendingCollection[]> {
  try {
    // Get collections with sum of likes from their listed NFTs
    const trendingCollections = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        image: collections.image,
        userId: collections.userId,
        categories: collections.categories,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        totalLikes: sql<number>`COALESCE(SUM(CASE WHEN ${nfts.isListed} IS NOT NULL THEN ${nfts.likes} ELSE 0 END), 0)`.as("totalLikes"),
      })
      .from(collections)
      .leftJoin(nfts, eq(collections.id, nfts.collectionId))
      .groupBy(collections.id)
      .orderBy(desc(sql<number>`COALESCE(SUM(CASE WHEN ${nfts.isListed} IS NOT NULL THEN ${nfts.likes} ELSE 0 END), 0)`))
      .limit(limit);

    // Filter out collections with 0 total likes and map results
    return trendingCollections
      .filter((col) => Number(col.totalLikes) > 0)
      .map((col) => ({
        ...col,
        totalLikes: Number(col.totalLikes) || 0,
      }));
  } catch (error) {
    console.error("Error fetching trending collections:", error);
    return [];
  }
}
