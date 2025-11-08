"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { env } from "@/env";
import { revalidatePath } from "next/cache";

export type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: Date | null;
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
