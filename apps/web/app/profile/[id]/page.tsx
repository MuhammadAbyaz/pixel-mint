import React from "react";
import { notFound } from "next/navigation";
import { getUserById, isOwnProfile } from "@/actions/user.actions";
import { getUserCollections } from "@/actions/collection.actions";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function UserProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id);
  const isOwner = await isOwnProfile(id);

  if (!user) {
    notFound();
  }

  // Fetch user's collections from database
  const dbCollections = await getUserCollections(id);

  // Transform database collections to match the expected format
  const userCollections = dbCollections.map((collection) => ({
    name: collection.name,
    image: collection.image,
    slug: collection.id, // Using ID as slug for now
  }));

  // TODO: Fetch user's favorited collections
  // For now, using empty array until favorites functionality is implemented
  const userFavorites: { name: string; image: string; slug: string }[] = [];

  return (
    <ProfileClient
      user={user}
      isOwner={isOwner}
      collections={userCollections}
      favorites={userFavorites}
    />
  );
}
