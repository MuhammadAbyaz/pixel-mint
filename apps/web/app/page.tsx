import { getTrendingCollections } from "@/actions/collection.actions";
import { auth } from "@/auth";
import MarketPlace from "./page-client";

export default async function MarketPlacePage() {
  const initialTrendingCollections = await getTrendingCollections(4);
  const session = await auth();
  const currentUserId = session?.user?.id || null;
  return <MarketPlace initialTrendingCollections={initialTrendingCollections} currentUserId={currentUserId} />;
}

