"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Image as ImageIcon } from "lucide-react";
import type { Collection } from "@/actions/collection.actions";
import type { NFT } from "@/actions/nft.actions";
import type { UserProfile } from "@/actions/user.actions";
import NFTDetailModal from "@/components/nft/NFTDetailModal";

type CollectionDetailClientProps = {
  collection: Collection;
  nfts: NFT[];
  owner: UserProfile | null;
  currentUserId?: string | null;
};

export default function CollectionDetailClient({
  collection,
  nfts: initialNFTs,
  owner,
  currentUserId = null,
}: CollectionDetailClientProps) {
  const [selectedNFTId, setSelectedNFTId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>(initialNFTs);

  return (
    <div className="relative min-h-screen w-full bg-background">
      <main className="px-4 sm:px-8 lg:px-[120px] pt-[120px] pb-[100px] max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link
            href="/"
            className="hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href={owner ? `/profile/${owner.id}` : "#"}
            className="hover:text-foreground transition-colors"
          >
            {owner?.name || "Creator"}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{collection.name}</span>
        </div>

        {/* Collection Header */}
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            {/* Collection Image */}
            <div className="relative w-full sm:w-64 h-64 rounded-2xl overflow-hidden bg-card border border-border flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={collection.image}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Collection Info */}
            <div className="flex-1">
              <h1 className="text-foreground text-3xl sm:text-4xl font-semibold mb-4">
                {collection.name}
              </h1>
              <p className="text-muted-foreground text-base mb-6 max-w-2xl">
                {collection.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Items</p>
                  <p className="text-foreground text-xl font-semibold">
                    {nfts.length}
                  </p>
                </div>
                {owner && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">
                      Created by
                    </p>
                    <Link
                      href={owner.id ? `/profile/${owner.id}` : "#"}
                      className="text-foreground text-xl font-semibold hover:text-primary transition-colors"
                    >
                      {owner.name || owner.email || "Unknown"}
                    </Link>
                  </div>
                )}
              </div>

              {/* Categories */}
              {collection.categories && collection.categories.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {collection.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-card border border-border rounded-full text-sm text-foreground"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NFTs Grid */}
        {nfts.length > 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h2 className="text-foreground text-2xl sm:text-3xl font-semibold mb-8">
              NFTs in this Collection
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {nfts.map((nft, index) => (
                <div
                  key={nft.id}
                  onClick={() => {
                    setSelectedNFTId(nft.id);
                    setIsModalOpen(true);
                  }}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:border-foreground/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-foreground/10 group cursor-pointer"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="relative w-full aspect-square overflow-hidden bg-background">
                    {nft.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-foreground text-lg font-semibold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {nft.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {nft.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">
                          Price
                        </p>
                        <p className="text-foreground text-base font-semibold">
                          {parseFloat(nft.price).toFixed(4)} ETH
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="w-24 h-24 rounded-full bg-card border border-border flex items-center justify-center mb-6">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-foreground text-2xl font-semibold mb-2">
              No NFTs yet
            </h2>
            <p className="text-muted-foreground text-base max-w-md">
              This collection doesn't have any NFTs yet. Check back later or
              create one to get started!
            </p>
          </div>
        )}

        {/* NFT Detail Modal */}
        <NFTDetailModal
          nftId={selectedNFTId}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          currentUserId={currentUserId}
          onLikeSuccess={async (updatedNFT) => {
            // Update the NFT in the collection's NFTs list
            setNfts((prev) =>
              prev.map((nft) =>
                nft.id === updatedNFT.id
                  ? { ...nft, likes: updatedNFT.likes }
                  : nft
              )
            );
          }}
        />
      </main>
    </div>
  );
}

