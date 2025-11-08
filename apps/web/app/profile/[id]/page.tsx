import React from "react";
import { notFound } from "next/navigation";
import { getUserById, isOwnProfile } from "@/actions/user.actions";
import ProfileClient from "@/components/profile/ProfileClient";

// Image constants from Figma
const imgRectangle32 =
  "https://www.figma.com/api/mcp/asset/29a8b980-896f-4e46-9890-bdf8bc745d1e";
const imgRectangle33 =
  "https://www.figma.com/api/mcp/asset/43c72d70-b252-4e90-af10-0185a55b3175";
const imgRectangle34 =
  "https://www.figma.com/api/mcp/asset/9b0eb81a-b456-4417-8b32-6803aaeaca31";
const imgRectangle35 =
  "https://www.figma.com/api/mcp/asset/c65587d4-3cce-40d9-ace7-b1de43988fd9";

type Collection = {
  name: string;
  image: string;
  slug: string;
};

const userCollections: Collection[] = [
  {
    name: "Abstractions",
    image: imgRectangle32,
    slug: "abstractions",
  },
  {
    name: "Sentinels of Light (Bundle)",
    image: imgRectangle33,
    slug: "sentinels-of-light",
  },
  {
    name: "Digital Arts",
    image: imgRectangle34,
    slug: "digital-arts",
  },
  {
    name: "Natural Beauty",
    image: imgRectangle35,
    slug: "natural-beauty",
  },
  {
    name: "Abstractions",
    image: imgRectangle32,
    slug: "abstractions-2",
  },
  {
    name: "Sentinels of Light (Bundle)",
    image: imgRectangle33,
    slug: "sentinels-of-light-2",
  },
  {
    name: "Digital Arts",
    image: imgRectangle34,
    slug: "digital-arts-2",
  },
  {
    name: "Natural Beauty",
    image: imgRectangle35,
    slug: "natural-beauty-2",
  },
  {
    name: "Abstractions",
    image: imgRectangle32,
    slug: "abstractions-3",
  },
];

const userFavorites: Collection[] = [
  {
    name: "Abstractions",
    image: imgRectangle32,
    slug: "abstractions",
  },
  {
    name: "Sentinels of Light (Bundle)",
    image: imgRectangle33,
    slug: "sentinels-of-light",
  },
  {
    name: "Digital Arts",
    image: imgRectangle34,
    slug: "digital-arts",
  },
];

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

  return (
    <ProfileClient
      user={user}
      isOwner={isOwner}
      collections={userCollections}
      favorites={userFavorites}
    />
  );
}
