"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, collections, nfts } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { env } from "@/env";
import { revalidatePath } from "next/cache";

export type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: Date | null;
  walletAddress: string | null;
};

export async function getUserById(id: string): Promise<UserProfile | null> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    return user || null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function isOwnProfile(id: string): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;

    return currentUser.id === id;
  } catch (error) {
    console.error("Error checking profile ownership:", error);
    return false;
  }
}

export async function uploadProfileImage(
  formData: FormData,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Please upload an image.",
      };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: "File size must be less than 5MB" };
    }

    // Create unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(env.SUPABASE_BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return { success: false, error: "Failed to upload image" };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(env.SUPABASE_BUCKET_NAME)
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    // Update user in database
    await db
      .update(users)
      .set({ image: publicUrl })
      .where(eq(users.id, currentUser.id));

    // Delete old image if exists and is from Supabase
    if (
      currentUser.image &&
      currentUser.image.includes(env.SUPABASE_BUCKET_NAME)
    ) {
      const oldPath = currentUser.image.split("/").slice(-2).join("/");
      await supabase.storage.from(env.SUPABASE_BUCKET_NAME).remove([oldPath]);
    }

    revalidatePath(`/profile/${currentUser.id}`);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateDisplayName(
  name: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Name cannot be empty" };
    }

    if (name.length > 50) {
      return { success: false, error: "Name must be less than 50 characters" };
    }

    // Update user in database
    await db
      .update(users)
      .set({ name: name.trim() })
      .where(eq(users.id, currentUser.id));

    revalidatePath(`/profile/${currentUser.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating display name:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateProfile(
  name: string,
  imageFormData?: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    // Upload new image if provided
    if (imageFormData) {
      const uploadResult = await uploadProfileImage(imageFormData);
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }
    }

    // Update name if changed
    if (name !== currentUser.name) {
      const nameResult = await updateDisplayName(name);
      if (!nameResult.success) {
        return { success: false, error: nameResult.error };
      }
    }

    revalidatePath(`/profile/${currentUser.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export type TrendingCreator = UserProfile & {
  totalLikes: number;
  collectionCount: number;
};

export async function updateWalletAddress(
  walletAddress: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate wallet address format (basic Ethereum address validation)
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return { success: false, error: "Invalid wallet address format" };
    }

    // Update user in database
    await db
      .update(users)
      .set({ walletAddress: walletAddress.toLowerCase() })
      .where(eq(users.id, currentUser.id));

    revalidatePath(`/profile/${currentUser.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating wallet address:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getTrendingCreators(
  limit: number = 4,
): Promise<TrendingCreator[]> {
  try {
    const trendingCreators = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        emailVerified: users.emailVerified,
        walletAddress: users.walletAddress,
        totalLikes:
          sql<number>`COALESCE(SUM(CASE WHEN ${nfts.isListed} IS NOT NULL THEN ${nfts.likes} ELSE 0 END), 0)`.as(
            "totalLikes",
          ),
        collectionCount: sql<number>`COUNT(DISTINCT ${collections.id})`.as(
          "collectionCount",
        ),
      })
      .from(users)
      .leftJoin(collections, eq(users.id, collections.userId))
      .leftJoin(nfts, eq(collections.id, nfts.collectionId))
      .groupBy(users.id)
      .orderBy(
        desc(
          sql<number>`COALESCE(SUM(CASE WHEN ${nfts.isListed} IS NOT NULL THEN ${nfts.likes} ELSE 0 END), 0)`,
        ),
      )
      .limit(limit);

    return trendingCreators
      .filter((creator) => Number(creator.totalLikes) > 0)
      .map((creator) => ({
        id: creator.id,
        name: creator.name,
        email: creator.email,
        image: creator.image,
        emailVerified: creator.emailVerified,
        walletAddress: creator.walletAddress,
        totalLikes: Number(creator.totalLikes) || 0,
        collectionCount: Number(creator.collectionCount) || 0,
      }));
  } catch (error) {
    console.error("Error fetching trending creators:", error);
    return [];
  }
}
