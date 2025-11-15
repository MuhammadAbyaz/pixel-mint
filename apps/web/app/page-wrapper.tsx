import { getTrendingNFTs } from "@/actions/nft.actions";
import MarketPlace from "./page-client";

export default async function MarketPlacePage() {
  const initialTrendingNFTs = await getTrendingNFTs(4);
  return <MarketPlace initialTrendingNFTs={initialTrendingNFTs} />;
}

