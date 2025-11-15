"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Heart, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getAllNFTs } from "@/actions/nft.actions";
import type { NFT } from "@/actions/nft.actions";
import type { TrendingCollection } from "@/actions/collection.actions";
import { getTrendingCollections } from "@/actions/collection.actions";
import type { TrendingCreator } from "@/actions/user.actions";
import { getTrendingCreators, getUserById } from "@/actions/user.actions";
import { Loader as LoaderComponent } from "@/components/ui/loader";
import NFTDetailModal from "@/components/nft/NFTDetailModal";

// Image constants from Figma (fallback for creator avatars)
const imgRectangle26 =
  "https://www.figma.com/api/mcp/asset/a7d9eba4-cb3c-4e45-a51d-9c5274788fc7";

function MarketPlace({
  initialTrendingCollections,
  initialTrendingCreators,
  currentUserId,
}: {
  initialTrendingCollections: TrendingCollection[];
  initialTrendingCreators: TrendingCreator[];
  currentUserId?: string | null;
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [trendingCollections, setTrendingCollections] = useState<
    TrendingCollection[]
  >(initialTrendingCollections);
  const [trendingCreators, setTrendingCreators] = useState<TrendingCreator[]>(
    initialTrendingCreators,
  );
  const [collectionOwners, setCollectionOwners] = useState<
    Record<string, { name: string | null; email: string | null }>
  >({});
  const [allNFTs, setAllNFTs] = useState<NFT[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedNFTId, setSelectedNFTId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load initial NFTs
  useEffect(() => {
    const loadInitialNFTs = async () => {
      setIsLoadingMore(true);
      const nfts = await getAllNFTs(12, 0);
      setAllNFTs(nfts);
      setOffset(12);
      setHasMore(nfts.length === 12);
      setIsLoadingMore(false);
    };
    loadInitialNFTs();
  }, []);

  // Load more NFTs
  const loadMoreNFTs = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const newNFTs = await getAllNFTs(12, offset);

    if (newNFTs.length === 0) {
      setHasMore(false);
    } else {
      setAllNFTs((prev) => [...prev, ...newNFTs]);
      setOffset((prev) => prev + 12);
      setHasMore(newNFTs.length === 12);
    }
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, offset]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMoreNFTs();
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, loadMoreNFTs]);

  // Load collection owners
  useEffect(() => {
    const loadOwners = async () => {
      const owners: Record<
        string,
        { name: string | null; email: string | null }
      > = {};
      await Promise.all(
        trendingCollections.map(async (collection) => {
          const owner = await getUserById(collection.userId);
          if (owner) {
            owners[collection.id] = {
              name: owner.name,
              email: owner.email,
            };
          }
        }),
      );
      setCollectionOwners(owners);
    };
    if (trendingCollections.length > 0) {
      loadOwners();
    }
  }, [trendingCollections]);

  // Reset carousel slide when collections change
  useEffect(() => {
    if (
      trendingCollections.length > 0 &&
      currentSlide >= trendingCollections.length
    ) {
      setCurrentSlide(0);
    }
  }, [trendingCollections.length, currentSlide]);

  // Auto-advance carousel
  useEffect(() => {
    if (trendingCollections.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % trendingCollections.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [trendingCollections.length]);

  const nextSlide = () => {
    if (trendingCollections.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % trendingCollections.length);
  };

  const prevSlide = () => {
    if (trendingCollections.length === 0) return;
    setCurrentSlide(
      (prev) =>
        (prev - 1 + trendingCollections.length) % trendingCollections.length,
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-background">
      <main className="px-4 sm:px-8 lg:px-[52px] pt-[102px]">
        {/* Filter buttons and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-[51px] items-start sm:items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex gap-[6px] flex-wrap">
            <button
              onClick={() => setActiveFilter("All")}
              className={`h-10 px-4 rounded-lg border border-border font-semibold text-sm transition-all duration-300 hover:scale-105 hover:border-foreground/50 ${
                activeFilter === "All"
                  ? "bg-card text-foreground"
                  : "bg-card text-foreground hover:bg-card/80"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("Gaming")}
              className={`h-10 px-4 rounded-lg border border-border font-medium text-sm transition-all duration-300 hover:scale-105 hover:border-foreground/50 ${
                activeFilter === "Gaming"
                  ? "bg-card text-foreground"
                  : "bg-card text-foreground hover:bg-card/80"
              }`}
            >
              Gaming
            </button>
            <button
              onClick={() => setActiveFilter("Art")}
              className={`h-10 px-4 rounded-lg border border-border font-medium text-sm transition-all duration-300 hover:scale-105 hover:border-foreground/50 ${
                activeFilter === "Art"
                  ? "bg-card text-foreground"
                  : "bg-card text-foreground hover:bg-card/80"
              }`}
            >
              Art
            </button>
            <button
              onClick={() => setActiveFilter("More")}
              className={`h-10 px-4 rounded-lg border border-border font-medium text-sm transition-all duration-300 hover:scale-105 hover:border-foreground/50 ${
                activeFilter === "More"
                  ? "bg-card text-foreground"
                  : "bg-card text-foreground hover:bg-card/80"
              }`}
            >
              More
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-[497px]">
            <div className="h-10 rounded-lg bg-card border border-border flex items-center px-4 gap-2 transition-all duration-300 hover:border-foreground/50 focus-within:border-foreground/70">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Collections Or Creators"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Hero Banner Carousel */}
        {trendingCollections.length > 0 && (
          <div className="relative h-[305px] sm:h-[557px] rounded-[20px] overflow-hidden mb-[117px] group">
            {/* Carousel Images */}
            {trendingCollections.map((collection, index) => (
              <Link
                href={`/collection/${collection.id}`}
                key={collection.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out cursor-pointer ${
                  index === currentSlide
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-105"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </Link>
            ))}

            {/* Content */}
            {trendingCollections[currentSlide] && (
              <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 z-10">
                <h1 className="text-foreground text-2xl sm:text-3xl font-semibold mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {trendingCollections[currentSlide].name}
                </h1>
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                  <p className="text-foreground text-base sm:text-lg font-medium">
                    by{" "}
                    {collectionOwners[trendingCollections[currentSlide].id]
                      ?.name ||
                      collectionOwners[trendingCollections[currentSlide].id]
                        ?.email ||
                      "Unknown"}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <button
              onClick={(e) => {
                e.preventDefault();
                prevSlide();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/70 text-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                nextSlide();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/70 text-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {trendingCollections.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentSlide(index);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentSlide
                      ? "bg-foreground w-8 h-2"
                      : "bg-foreground/50 w-2 h-2 hover:bg-foreground/75"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Trending Creators */}
        <section className="mb-[153px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold mb-12">
            Trending Creators
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-[15px]">
            {trendingCreators.length > 0 ? (
              trendingCreators.map((creator, index) => (
                <Link
                  href={`/profile/${creator.id}`}
                  key={creator.id}
                  className="bg-card border border-border rounded-[20px] h-[98px] flex items-center gap-4 px-4 transition-all duration-300 hover:scale-105 hover:border-foreground/50 hover:shadow-lg hover:shadow-foreground/10 cursor-pointer group"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={creator.image || imgRectangle26}
                      alt={creator.name || creator.email || "Creator"}
                      className="w-[64px] h-[64px] rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-foreground text-sm font-semibold truncate">
                        {creator.name || creator.email || "Unknown"}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-xs transition-colors group-hover:text-foreground/70">
                      Popularity:{" "}
                      {creator.totalLikes >= 1000000
                        ? `${(creator.totalLikes / 1000000).toFixed(1)}M`
                        : creator.totalLikes >= 1000
                          ? `${(creator.totalLikes / 1000).toFixed(1)}K`
                          : creator.totalLikes}
                    </p>
                    <p className="text-muted-foreground text-xs transition-colors group-hover:text-foreground/70">
                      Total Collections: {creator.collectionCount}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-base">
                  No trending creators available yet. Check back later!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Trending Collections */}
        <section className="pb-[100px] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold mb-12">
            Trending Collections
          </h2>
          {trendingCollections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-[13px]">
              {trendingCollections.map((collection, index) => (
                <Link
                  key={collection.id}
                  href={`/collection/${collection.id}`}
                  className="border border-border rounded-[20px] overflow-hidden bg-card transition-all duration-300 hover:scale-105 hover:border-foreground/50 hover:shadow-lg hover:shadow-foreground/10 cursor-pointer group"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="relative h-[165px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {/* Total Likes Badge */}
                    <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-xs font-medium text-foreground">
                        {collection.totalLikes >= 1000
                          ? `${(collection.totalLikes / 1000).toFixed(1)}K`
                          : collection.totalLikes}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-foreground text-sm font-semibold mb-1 transition-colors group-hover:text-foreground line-clamp-1">
                      {collection.name}
                    </p>
                    <p className="text-muted-foreground text-xs transition-colors group-hover:text-foreground/70 line-clamp-2">
                      {collection.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-base">
                No trending collections available yet. Check back later!
              </p>
            </div>
          )}
        </section>

        {/* All NFTs Section with Infinite Scroll */}
        <section className="pb-[100px] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-foreground text-2xl sm:text-3xl font-semibold mb-12">
            All NFTs
          </h2>
          {allNFTs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-[13px]">
                {allNFTs.map((nft, index) => (
                  <div
                    key={nft.id}
                    onClick={() => {
                      setSelectedNFTId(nft.id);
                      setIsModalOpen(true);
                    }}
                    className="border border-border rounded-[20px] overflow-hidden bg-card transition-all duration-300 hover:scale-105 hover:border-foreground/50 hover:shadow-lg hover:shadow-foreground/10 cursor-pointer group"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className="relative h-[165px] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Likes Badge */}
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-xs font-medium text-foreground">
                          {nft.likes}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-foreground text-sm font-semibold mb-1 transition-colors group-hover:text-foreground line-clamp-1">
                        {nft.name}
                      </p>
                      <p className="text-muted-foreground text-xs transition-colors group-hover:text-foreground/70">
                        {parseFloat(nft.price).toFixed(4)} ETH
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Loading indicator and observer target */}
              <div ref={observerTarget} className="mt-12 flex justify-center">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LoaderComponent size="sm" />
                    <span className="text-sm">Loading more NFTs...</span>
                  </div>
                )}
                {!hasMore && allNFTs.length > 0 && (
                  <div className="flex flex-col items-center gap-3 py-8 px-6 bg-card border border-border rounded-2xl max-w-md">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-foreground font-semibold text-base mb-1">
                        You&apos;ve seen all NFTs
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Check back later for new listings
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              {isLoadingMore ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <LoaderComponent size="sm" />
                  <span className="text-base">Loading NFTs...</span>
                </div>
              ) : (
                <p className="text-muted-foreground text-base">
                  No NFTs available yet. Check back later!
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      {/* NFT Detail Modal */}
      <NFTDetailModal
        nftId={selectedNFTId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        currentUserId={currentUserId}
        onLikeSuccess={async (updatedNFT) => {
          // Update the NFT in allNFTs list
          setAllNFTs((prev) =>
            prev.map((nft) =>
              nft.id === updatedNFT.id
                ? { ...nft, likes: updatedNFT.likes }
                : nft,
            ),
          );

          // Refresh trending collections and creators after like/unlike
          const [newTrendingCollections, newTrendingCreators] =
            await Promise.all([
              getTrendingCollections(4),
              getTrendingCreators(4),
            ]);
          setTrendingCollections(newTrendingCollections);
          setTrendingCreators(newTrendingCreators);
        }}
      />
    </div>
  );
}

export default MarketPlace;
