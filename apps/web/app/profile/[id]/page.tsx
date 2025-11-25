import React from "react";
import { notFound } from "next/navigation";
import { getUserById, isOwnProfile } from "@/actions/user.actions";
import { getUserCollections } from "@/actions/collection.actions";
import { getUserNFTs } from "@/actions/nft.actions";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function UserProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || typeof id !== "string" || id.trim() === "") {
    notFound();
  }

  const user = await getUserById(id);
  const isOwner = await isOwnProfile(id);

  if (!user) {
    notFound();
  }

  const dbCollections = await getUserCollections(id);

  const userCollections = dbCollections.map((collection) => ({
    name: collection.name,
    image: collection.image,
    slug: collection.id, // Using ID as slug for now
  }));

  const userNFTs = await getUserNFTs(id);
  const userFavorites: { name: string; image: string; slug: string }[] = [];

  return (
    <ProfileClient
      user={user}
      isOwner={isOwner}
      collections={userCollections}
      favorites={userFavorites}
      nfts={userNFTs}
    />
  );
}
