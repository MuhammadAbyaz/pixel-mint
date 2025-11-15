import { getTrendingCollections } from "@/actions/collection.actions";
import { getTrendingCreators } from "@/actions/user.actions";
import { auth } from "@/auth";
import MarketPlace from "./page-client";

export default async function MarketPlacePage() {
  const initialTrendingCollections = await getTrendingCollections(4);
  const initialTrendingCreators = await getTrendingCreators(4);
  const session = await auth();
  const currentUserId = session?.user?.id || null;
  return (
    <MarketPlace
      initialTrendingCollections={initialTrendingCollections}
      initialTrendingCreators={initialTrendingCreators}
      currentUserId={currentUserId}
    />
  );
}

