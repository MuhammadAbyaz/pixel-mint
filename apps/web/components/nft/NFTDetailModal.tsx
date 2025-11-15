"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Heart,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";
import { getNFTById, toggleLikeNFT, purchaseNFT } from "@/actions/nft.actions";
import { getCollectionById } from "@/actions/collection.actions";
import { getUserById } from "@/actions/user.actions";
import type { NFT } from "@/actions/nft.actions";
import type { Collection } from "@/actions/collection.actions";
import type { UserProfile } from "@/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

type NFTDetailModalProps = {
  nftId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string | null;
};

export default function NFTDetailModal({
  nftId,
  open,
  onOpenChange,
  currentUserId = null,
}: NFTDetailModalProps) {
  const { resolvedTheme } = useTheme();
  const [nft, setNft] = useState<NFT | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [blockchainExpanded, setBlockchainExpanded] = useState(true);
  const [priceHistoryExpanded, setPriceHistoryExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [primaryColor, setPrimaryColor] = useState<string>("#3b82f6");

  useEffect(() => {
    setMounted(true);
    // Get computed primary color from CSS
    if (typeof window !== "undefined") {
      const updatePrimaryColor = () => {
        // Create a temporary element with primary color to get computed value
        const tempEl = document.createElement("div");
        tempEl.className = "bg-primary";
        tempEl.style.position = "absolute";
        tempEl.style.visibility = "hidden";
        tempEl.style.width = "1px";
        tempEl.style.height = "1px";
        document.body.appendChild(tempEl);

        const computedStyle = window.getComputedStyle(tempEl);
        const bgColor = computedStyle.backgroundColor;
        document.body.removeChild(tempEl);

        if (
          bgColor &&
          bgColor !== "rgba(0, 0, 0, 0)" &&
          bgColor !== "transparent"
        ) {
          setPrimaryColor(bgColor);
        }
      };

      // Update immediately
      updatePrimaryColor();

      // Also update when theme changes (with a small delay to ensure DOM is updated)
      const timeoutId = setTimeout(updatePrimaryColor, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (open && nftId) {
      loadNFTDetails();
    } else {
      setNft(null);
      setCollection(null);
      setOwner(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nftId]);

  const loadNFTDetails = async () => {
    if (!nftId) return;

    setIsLoading(true);
    try {
      const nftData = await getNFTById(nftId);
      if (nftData) {
        setNft(nftData);

        const [collectionData, ownerData] = await Promise.all([
          getCollectionById(nftData.collectionId),
          getUserById(nftData.userId),
        ]);

        setCollection(collectionData);
        setOwner(ownerData);
      }
    } catch (error) {
      console.error("Error loading NFT details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!nft || isLiking) return;

    setIsLiking(true);
    try {
      const result = await toggleLikeNFT(nft.id);
      if (result.success) {
        setNft({ ...nft, likes: result.likes });
        toast.success("Liked!");
      } else {
        toast.error(result.error || "Failed to like NFT");
      }
    } catch (error) {
      console.error("Error liking NFT:", error);
      toast.error("Failed to like NFT");
    } finally {
      setIsLiking(false);
    }
  };

  const handleBuyNow = async () => {
    if (!nft || isBuying) return;

    setIsBuying(true);
    try {
      const result = await purchaseNFT(nft.id);
      if (result.success) {
        toast.success(`Successfully purchased ${nft.name}!`);
        // Reload NFT details to reflect new ownership
        await loadNFTDetails();
        // Close modal after a short delay
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        toast.error(result.error || "Failed to purchase NFT");
      }
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      toast.error("Failed to purchase NFT");
    } finally {
      setIsBuying(false);
    }
  };

  const contractAddress = nft?.id
    ? `0x${nft.id.slice(0, 3)}...${nft.id.slice(-4)}`
    : "0x143...c1f3";
  const tokenId = nft?.id ? parseInt(nft.id.slice(0, 8), 16).toString() : "200";

  const priceHistory = [
    { date: "Mar 12", price: 12.3 },
    { date: "Mar 14", price: 12.35 },
    { date: "Mar 16", price: 12.4 },
    { date: "Mar 18", price: 12.38 },
    { date: "Mar 20", price: 12.42 },
    { date: "Mar 22", price: 12.45 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[1400px] w-[95vw] h-[90vh] overflow-hidden p-0 gap-0 bg-background border border-border rounded-2xl flex flex-col"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">
          NFT Details: {nft?.name || "Loading"}
        </DialogTitle>
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[600px]">
            <div
              className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${
                resolvedTheme === "dark"
                  ? "border-primary-foreground"
                  : "border-black"
              }`}
            />
          </div>
        ) : nft ? (
          <div className="flex flex-col lg:flex-row h-full flex-1 min-h-0">
            {/* Left Side - NFT Image */}
            <div className="lg:w-1/2 p-6 lg:p-10 xl:p-12 bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
              <div className="relative w-full aspect-square max-w-lg rounded-2xl overflow-hidden bg-card border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Right Side - NFT Details */}
            <div className="lg:w-1/2 p-8 lg:p-12 bg-card flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-2">
                {/* Page Title */}
                <div className="mb-8">
                  <h1 className="text-lg font-medium text-muted-foreground mb-2">
                    NFT Overview
                  </h1>
                  <div className="h-1 w-12 bg-primary rounded-full"></div>
                </div>

                {/* NFT Title with Likes */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <h2 className="text-foreground text-3xl sm:text-4xl font-bold flex-1 leading-tight">
                    {nft.name}
                  </h2>
                  {(() => {
                    const isOwnNFT =
                      currentUserId &&
                      String(currentUserId) === String(nft.userId);
                    if (isOwnNFT) {
                      return (
                        <div className="flex items-center gap-2 bg-background/50 rounded-full px-4 py-2 flex-shrink-0 border border-border">
                          <Heart className="w-4 h-4 text-muted-foreground fill-muted-foreground" />
                          <span className="text-foreground text-sm font-semibold">
                            {nft.likes >= 1000
                              ? `${(nft.likes / 1000).toFixed(1)}K`
                              : nft.likes}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={handleLike}
                        disabled={isLiking}
                        className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full px-4 py-2 flex-shrink-0 hover:from-primary/20 hover:to-primary/10 transition-all duration-300 disabled:opacity-50 cursor-pointer border border-primary/20 shadow-sm hover:shadow-md"
                        title={isLiking ? "Liking..." : "Like this NFT"}
                      >
                        <Heart
                          className={`w-4 h-4 text-primary fill-primary transition-transform ${isLiking ? "animate-pulse scale-110" : "hover:scale-110"}`}
                        />
                        <span className="text-foreground text-sm font-semibold">
                          {nft.likes >= 1000
                            ? `${(nft.likes / 1000).toFixed(1)}K`
                            : nft.likes}
                        </span>
                      </button>
                    );
                  })()}
                </div>

                {/* Collection and Owner */}
                <div className="space-y-3 mb-8">
                  {collection && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm font-medium">
                        Collection:
                      </span>
                      <Link
                        href={`/collection/${collection.id}`}
                        className="text-foreground hover:text-primary transition-colors font-semibold text-sm bg-background/50 px-3 py-1 rounded-lg hover:bg-background"
                      >
                        {collection.name}
                      </Link>
                    </div>
                  )}
                  {owner && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm font-medium">
                        Owned By:
                      </span>
                      <Link
                        href={`/profile/${owner.id}`}
                        className="text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 font-semibold text-sm bg-background/50 px-3 py-1 rounded-lg hover:bg-background"
                      >
                        {owner.name || owner.email || "Unknown"}
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Current Price */}
                <div className="mb-8 p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20">
                  <p className="text-muted-foreground text-sm mb-3 font-medium">
                    Current Price
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-bold text-foreground">
                      ${(parseFloat(nft.price) * 2495.78).toFixed(0)}
                    </p>
                    <p className="text-lg text-muted-foreground font-medium">
                      ({parseFloat(nft.price).toFixed(4)} ETH)
                    </p>
                  </div>
                </div>

                {/* Expandable Sections */}
                <div className="space-y-4 mb-6">
                  {/* Blockchain Details */}
                  <div className="border border-border rounded-xl overflow-hidden bg-background/50 backdrop-blur-sm flex-shrink-0 shadow-sm hover:shadow-md transition-shadow">
                    <button
                      onClick={() => setBlockchainExpanded(!blockchainExpanded)}
                      className="w-full flex items-center justify-between p-5 hover:bg-background/70 transition-colors"
                    >
                      <span className="text-foreground font-semibold text-base">
                        Blockchain details
                      </span>
                      {blockchainExpanded ? (
                        <ChevronUp className="w-5 h-5 text-primary transition-transform" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform" />
                      )}
                    </button>
                    {blockchainExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-border pt-5 bg-background/30">
                        <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                          <p className="text-muted-foreground text-xs mb-2 font-medium uppercase tracking-wide">
                            Contract Address
                          </p>
                          <p className="text-foreground font-mono text-sm font-semibold">
                            {contractAddress}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                          <p className="text-muted-foreground text-xs mb-2 font-medium uppercase tracking-wide">
                            Token ID
                          </p>
                          <p className="text-foreground font-mono text-sm font-semibold">
                            {tokenId}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                          <p className="text-muted-foreground text-xs mb-2 font-medium uppercase tracking-wide">
                            Token Standard
                          </p>
                          <p className="text-foreground text-sm font-semibold">
                            ERC721
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                          <p className="text-muted-foreground text-xs mb-2 font-medium uppercase tracking-wide">
                            Chain
                          </p>
                          <p className="text-foreground text-sm font-semibold">
                            Ethereum
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price History */}
                  <div className="border border-border rounded-xl overflow-hidden bg-background/50 backdrop-blur-sm flex-shrink-0 shadow-sm hover:shadow-md transition-shadow">
                    <button
                      onClick={() =>
                        setPriceHistoryExpanded(!priceHistoryExpanded)
                      }
                      className="w-full flex items-center justify-between p-5 hover:bg-background/70 transition-colors"
                    >
                      <span className="text-foreground font-semibold text-base">
                        Price history
                      </span>
                      {priceHistoryExpanded ? (
                        <ChevronUp className="w-5 h-5 text-primary transition-transform" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform" />
                      )}
                    </button>
                    {priceHistoryExpanded && mounted && (
                      <div className="px-5 pb-5 border-t border-border pt-5 bg-background/30">
                        <div className="h-48 w-full rounded-lg bg-background/50 p-4 border border-border/50">
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                            key={resolvedTheme}
                          >
                            <LineChart
                              data={priceHistory}
                              margin={{
                                top: 10,
                                right: 15,
                                left: -20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={
                                  resolvedTheme === "dark"
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "rgba(0, 0, 0, 0.1)"
                                }
                                opacity={resolvedTheme === "dark" ? 0.3 : 0.2}
                                vertical={false}
                              />
                              <XAxis
                                dataKey="date"
                                tick={{
                                  fontSize: 11,
                                  fill:
                                    resolvedTheme === "dark"
                                      ? "rgba(255, 255, 255, 0.7)"
                                      : "rgba(0, 0, 0, 0.6)",
                                  fontWeight: 500,
                                }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{
                                  fontSize: 11,
                                  fill:
                                    resolvedTheme === "dark"
                                      ? "rgba(255, 255, 255, 0.7)"
                                      : "rgba(0, 0, 0, 0.6)",
                                  fontWeight: 500,
                                }}
                                axisLine={false}
                                tickLine={false}
                                width={45}
                                domain={["dataMin - 0.05", "dataMax + 0.05"]}
                                tickFormatter={(value) => `${value.toFixed(1)}`}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor:
                                    resolvedTheme === "dark"
                                      ? "hsl(210, 20%, 15%)"
                                      : "hsl(0, 0%, 100%)",
                                  border:
                                    resolvedTheme === "dark"
                                      ? "1px solid rgba(255, 255, 255, 0.1)"
                                      : "1px solid rgba(0, 0, 0, 0.1)",
                                  borderRadius: "8px",
                                  color:
                                    resolvedTheme === "dark"
                                      ? "rgba(255, 255, 255, 0.9)"
                                      : "rgba(0, 0, 0, 0.9)",
                                  fontSize: "12px",
                                  padding: "8px 12px",
                                  boxShadow:
                                    resolvedTheme === "dark"
                                      ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                                      : "0 4px 12px rgba(0, 0, 0, 0.1)",
                                  fontWeight: 500,
                                }}
                                labelStyle={{
                                  color:
                                    resolvedTheme === "dark"
                                      ? "rgba(255, 255, 255, 0.7)"
                                      : "rgba(0, 0, 0, 0.6)",
                                  fontSize: "11px",
                                  marginBottom: "6px",
                                  fontWeight: 600,
                                }}
                                formatter={(value: number) => [
                                  `${value.toFixed(2)} ETH`,
                                  "Price",
                                ]}
                                cursor={{
                                  stroke: primaryColor,
                                  strokeWidth: 2,
                                  strokeDasharray: "4 4",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="price"
                                stroke={primaryColor}
                                strokeWidth={3}
                                dot={false}
                                activeDot={{
                                  r: 6,
                                  fill: primaryColor,
                                  stroke:
                                    resolvedTheme === "dark"
                                      ? "hsl(210, 20%, 15%)"
                                      : "hsl(0, 0%, 100%)",
                                  strokeWidth: 3,
                                }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buy Now Button - Fixed at bottom */}
              {(() => {
                const isOwnNFT =
                  currentUserId && String(currentUserId) === String(nft.userId);
                return !isOwnNFT;
              })() && (
                <div className="pt-6 border-t border-border mt-auto flex-shrink-0">
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold py-7 text-lg gap-3 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                    onClick={handleBuyNow}
                    disabled={isBuying}
                  >
                    {isBuying ? (
                      <>
                        <Loader size="sm" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-6 h-6" />
                        <span>Buy Now</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[500px]">
            <p className="text-muted-foreground">NFT not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
