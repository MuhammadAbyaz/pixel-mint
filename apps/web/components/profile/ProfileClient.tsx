"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Edit2, Plus, Wallet, Image as ImageIcon } from "lucide-react";
import type { UserProfile } from "@/actions/user.actions";
import type { NFT } from "@/actions/nft.actions";
import { updateWalletAddress } from "@/actions/user.actions";
import EditProfileDialog from "./EditProfileDialog";
import FloatingCreateButton from "../CreateButton";
import NFTDetailModal from "@/components/nft/NFTDetailModal";
import { Button } from "@/components/ui/button";
import { getAddress } from "viem";
import { toast } from "sonner";
import { isPolygonAmoyNetwork, switchToPolygonAmoy } from "@/lib/networks";

// Image constants from Figma
const imgRectangle31 =
  "https://www.figma.com/api/mcp/asset/c0b92990-cb0e-4b4d-b2b9-fed03eeebda8";
const imgImage6 =
  "https://www.figma.com/api/mcp/asset/af368e5b-5e1a-434c-9e21-5ab60e611279";

type Collection = {
  name: string;
  image: string;
  slug: string;
};

type ProfileClientProps = {
  user: UserProfile;
  isOwner: boolean;
  collections: Collection[];
  favorites: Collection[];
  nfts?: NFT[];
};

export default function ProfileClient({
  user,
  isOwner,
  collections,
  favorites,
  nfts = [],
}: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<
    "collections" | "favorites" | "nfts"
  >("collections");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(
    user.walletAddress,
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedNFTId, setSelectedNFTId] = useState<string | null>(null);
  const [isNFTModalOpen, setIsNFTModalOpen] = useState(false);

  // Sync wallet address with user prop when it changes
  useEffect(() => {
    setWalletAddress(user.walletAddress);
  }, [user.walletAddress]);

  const displayedItems =
    activeTab === "collections"
      ? collections
      : activeTab === "favorites"
        ? favorites
        : [];

  // Filter NFTs: show all NFTs if on "nfts" tab, or show NFTs without collections
  const displayedNFTs =
    activeTab === "nfts"
      ? nfts
      : activeTab === "collections"
        ? nfts.filter((nft) => !nft.collectionId)
        : [];

  const connectWallet = async () => {
    try {
      setIsConnecting(true);

      // Check if MetaMask is installed
      if (typeof window === "undefined" || !window.ethereum) {
        toast.error("MetaMask is not installed. Please install MetaMask to continue.");
        setIsConnecting(false);
        return;
      }

      // Check if user is on Polygon Amoy network, if not, switch to it
      const isOnPolygonAmoy = await isPolygonAmoyNetwork();
      if (!isOnPolygonAmoy) {
        toast.info("Switching to Polygon Amoy network...");
        const switched = await switchToPolygonAmoy();
        if (!switched) {
          toast.error("Please switch to Polygon Amoy network manually in MetaMask");
          setIsConnecting(false);
          return;
        }
      }

      // Request account access using MetaMask's standard API
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        toast.error("No wallet address found");
        setIsConnecting(false);
        return;
      }

      const address = accounts[0];

      // Validate and normalize address using viem
      const normalizedAddress = getAddress(address);

      // Save wallet address to database
      const result = await updateWalletAddress(normalizedAddress);

      if (result.success) {
        setWalletAddress(normalizedAddress);
        toast.success("Wallet connected successfully!");
      } else {
        toast.error(result.error || "Failed to connect wallet");
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      if (error.code === 4001) {
        toast.error("Please connect to MetaMask");
      } else {
        toast.error("Failed to connect wallet. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const formatWalletAddress = (address: string | null) => {
    if (!address) return "";
    try {
      const normalized = getAddress(address);
      return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
    } catch {
      return address;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background">
      <main className="px-4 sm:px-8 lg:px-[52px] pt-[115px] pb-[100px]">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-[100px] animate-in fade-in slide-in-from-top-4 duration-700">
          {/* Profile Avatar */}
          <div className="relative group mb-6">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.image || imgRectangle31}
                alt={user.name || "User"}
                className="w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] rounded-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-blue-500/20"
              />
              {/* Edit Button - Only show for owner */}
              {isOwner && (
                <button
                  onClick={() => setIsEditDialogOpen(true)}
                  className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-primary-foreground p-2.5 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-primary/50"
                >
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h1 className="text-foreground text-xl sm:text-2xl font-semibold">
                {user.name || "Anonymous"}
              </h1>
              {/* Verified badge - for now showing for all */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgImage6}
                alt="Verified"
                className="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] animate-in zoom-in duration-500 delay-200"
              />
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mb-1 transition-colors hover:text-foreground/70">
              Popularity: 1 Million
            </p>
            <p className="text-muted-foreground text-xs sm:text-sm mb-4 transition-colors hover:text-foreground/70">
              Joined August 2001
            </p>
            {/* Wallet Address Section */}
            {walletAddress ? (
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <p className="text-foreground text-xs sm:text-sm font-mono">
                    {formatWalletAddress(walletAddress)}
                  </p>
                </div>
              </div>
            ) : (
              isOwner && (
                <div className="mb-4">
                  <Button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    {isConnecting ? "Connecting..." : "Connect MetaMask"}
                  </Button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-[48px] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="relative inline-flex gap-8 sm:gap-16">
            <button
              onClick={() => setActiveTab("collections")}
              className={`text-base sm:text-lg font-semibold pb-2 transition-all duration-300 relative ${
                activeTab === "collections"
                  ? "text-foreground"
                  : "text-foreground/50 hover:text-foreground/75"
              }`}
            >
              Collections
              {activeTab === "collections" && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground rounded-full animate-in slide-in-from-left duration-300" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("nfts")}
              className={`text-base sm:text-lg font-semibold pb-2 transition-all duration-300 relative ${
                activeTab === "nfts"
                  ? "text-foreground"
                  : "text-foreground/50 hover:text-foreground/75"
              }`}
            >
              My NFTs ({nfts.length})
              {activeTab === "nfts" && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground rounded-full animate-in slide-in-from-left duration-300" />
              )}
            </button>
            {/* Only show Favorites tab for owner */}
            {isOwner && (
              <button
                onClick={() => setActiveTab("favorites")}
                className={`text-base sm:text-lg font-medium pb-2 transition-all duration-300 relative ${
                  activeTab === "favorites"
                    ? "text-foreground"
                    : "text-foreground/50 hover:text-foreground/75"
                }`}
              >
                Favorites
                {activeTab === "favorites" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground rounded-full animate-in slide-in-from-left duration-300" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Collections/Favorites/NFTs Grid */}
        {activeTab === "nfts" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-[1280px] mx-auto">
            {displayedNFTs.map((nft, index) => (
              <div
                key={nft.id}
                onClick={() => {
                  setSelectedNFTId(nft.id);
                  setIsNFTModalOpen(true);
                }}
                className="border border-border rounded-2xl overflow-hidden bg-card transition-all duration-300 hover:scale-105 hover:border-foreground/50 hover:shadow-lg hover:shadow-foreground/10 cursor-pointer group animate-in fade-in zoom-in-95 duration-500"
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
                  <h3 className="text-foreground text-sm font-semibold mb-1 line-clamp-1">
                    {nft.name}
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-2">
                    {nft.description}
                  </p>
                  {nft.price && (
                    <p className="text-primary text-sm font-semibold mt-2">
                      {Number(nft.price).toFixed(4)} MATIC
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 max-w-[1280px] mx-auto">
            {displayedItems.map((item, index) => (
              <Link
                href={`/collection/${item.slug}`}
                key={`${item.slug}-${index}`}
                className="border border-border rounded-[20px] overflow-hidden bg-card transition-all duration-500 hover:scale-105 hover:border-foreground/50 hover:shadow-xl hover:shadow-foreground/10 cursor-pointer group animate-in fade-in zoom-in-95 duration-500"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="relative h-[165px] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover opacity-80 transition-all duration-700 group-hover:opacity-100 group-hover:scale-110"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="p-4">
                  <p className="text-foreground text-sm font-semibold transition-colors duration-300 group-hover:text-primary">
                    {item.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {activeTab === "nfts" && displayedNFTs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <p className="text-muted-foreground text-lg mb-2">
                No NFTs yet
              </p>
              <p className="text-muted-foreground/60 text-sm">
                {isOwner
                  ? "Create or purchase NFTs to see them here"
                  : "This user doesn't have any NFTs yet"}
              </p>
            </div>
          </div>
        )}
        {activeTab !== "nfts" && displayedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <p className="text-muted-foreground text-lg mb-2">
                {activeTab === "favorites"
                  ? "No favorites yet"
                  : "No collections yet"}
              </p>
              <p className="text-muted-foreground/60 text-sm">
                {activeTab === "favorites"
                  ? "Start exploring and add collections to your favorites"
                  : "Create your first collection to get started"}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Edit Profile Dialog */}
      {isOwner && (
        <EditProfileDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          user={user}
        />
      )}

      {/* NFT Detail Modal */}
      <NFTDetailModal
        nftId={selectedNFTId}
        open={isNFTModalOpen}
        onOpenChange={setIsNFTModalOpen}
        currentUserId={user.id}
      />
    </div>
  );
}
