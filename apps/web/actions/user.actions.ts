"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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
