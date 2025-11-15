import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCollectionById } from "@/actions/collection.actions";
import { getNFTsByCollection } from "@/actions/nft.actions";
import { getUserById } from "@/actions/user.actions";
import CollectionDetailClient from "@/components/collection/CollectionDetailClient";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getCollectionById(id);

  if (!collection) {
    notFound();
  }

  const nfts = await getNFTsByCollection(id);
  const owner = await getUserById(collection.userId);
  const session = await auth();
  const currentUserId = session?.user?.id || null;

  return (
    <CollectionDetailClient
      collection={collection}
      nfts={nfts}
      owner={owner}
      currentUserId={currentUserId}
    />
  );
}

