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
  FolderPlus,
  X,
  Tag,
  XCircle,
} from "lucide-react";
import {
  getNFTById,
  toggleLikeNFT,
  purchaseNFT,
  checkIfLiked,
  listNFTForSale,
  unlistNFT,
} from "@/actions/nft.actions";
import PriceHistory from "./PriceHistory";
import BlockchainInfo from "./BlockchainInfo";
import { buyNFT, getNFTOwnerOnChain, getPublicClient } from "@/lib/blockchain";
import { isPolygonAmoyNetwork, switchToPolygonAmoy } from "@/lib/networks";
import { getAddress } from "viem";
import {
  getCollectionById,
  getUserCollections,
} from "@/actions/collection.actions";
import { updateNFTCollection } from "@/actions/nft.actions";
import { getUserById } from "@/actions/user.actions";
import type { NFT } from "@/actions/nft.actions";
import type { Collection } from "@/actions/collection.actions";
import type { UserProfile } from "@/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { toast } from "sonner";

type NFTDetailModalProps = {
  nftId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string | null;
  onLikeSuccess?: (updatedNFT: {
    id: string;
    likes: number;
    isLiked: boolean;
  }) => void | Promise<void>;
};

export default function NFTDetailModal({
  nftId,
  open,
  onOpenChange,
  currentUserId = null,
  onLikeSuccess,
}: NFTDetailModalProps) {
  const { resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [nft, setNft] = useState<NFT | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [userCollections, setUserCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);
  const [showCollectionSelect, setShowCollectionSelect] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [isUnlisting, setIsUnlisting] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [blockchainExpanded, setBlockchainExpanded] = useState(true);
  const [priceHistoryExpanded, setPriceHistoryExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (open && nftId) {
      loadNFTDetails();
      loadLikeStatus();
    } else {
      setNft(null);
      setCollection(null);
      setOwner(null);
      setIsLiked(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nftId, currentUserId]);

  const loadLikeStatus = async () => {
    if (!nftId || !currentUserId) {
      setIsLiked(false);
      return;
    }
    try {
      const liked = await checkIfLiked(nftId);
      setIsLiked(liked);
    } catch (error) {
      console.error("Error loading like status:", error);
      setIsLiked(false);
    }
  };

  const loadNFTDetails = async () => {
    if (!nftId) return;

    setIsLoading(true);
    try {
      const nftData = await getNFTById(nftId);
      if (nftData) {
        setNft(nftData);

        const [collectionData, ownerData] = await Promise.all([
          nftData.collectionId
            ? getCollectionById(nftData.collectionId)
            : Promise.resolve(null),
          getUserById(nftData.userId),
        ]);

        setCollection(collectionData);
        setOwner(ownerData);

        // Load user collections if current user owns the NFT
        const isOwnNFT =
          currentUserId && String(currentUserId) === String(nftData.userId);
        if (isOwnNFT && currentUserId) {
          const collections = await getUserCollections(currentUserId);
          setUserCollections(collections);
        }
      }
    } catch (error) {
      console.error("Error loading NFT details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCollection = async (collectionId: string | null) => {
    if (!nftId || !nft) return;

    setIsUpdatingCollection(true);
    try {
      const result = await updateNFTCollection(nftId, collectionId);
      if (result.success) {
        // Update local state
        if (collectionId) {
          const newCollection = userCollections.find(
            (c) => c.id === collectionId,
          );
          setCollection(newCollection || null);
        } else {
          setCollection(null);
        }
        setNft({ ...nft, collectionId: collectionId });
        setShowCollectionSelect(false);
        toast.success(
          collectionId
            ? "NFT added to collection"
            : "NFT removed from collection",
        );
      } else {
        toast.error(result.error || "Failed to update collection");
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
    } finally {
      setIsUpdatingCollection(false);
    }
  };

  const handleLike = async () => {
    if (!nft || isLiking) return;

    setIsLiking(true);
    try {
      const result = await toggleLikeNFT(nft.id);
      if (result.success) {
        const updatedNFT = { ...nft, likes: result.likes };
        setNft(updatedNFT);
        setIsLiked(result.isLiked);
        toast.success(result.isLiked ? "Liked!" : "Unliked!");
        // Call the callback to refresh trending data and update NFT lists
        if (onLikeSuccess) {
          await onLikeSuccess({
            id: nft.id,
            likes: result.likes,
            isLiked: result.isLiked,
          });
        }
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
      // Check if wallet is connected
      if (typeof window === "undefined" || !window.ethereum) {
        toast.error("Please connect your MetaMask wallet");
        setIsBuying(false);
        return;
      }

      // Check if on Polygon Amoy network
      const isOnPolygonAmoy = await isPolygonAmoyNetwork();
      if (!isOnPolygonAmoy) {
        toast.info("Switching to Polygon Amoy network...");
        const switched = await switchToPolygonAmoy();
        if (!switched) {
          toast.error("Please switch to Polygon Amoy network manually");
          setIsBuying(false);
          return;
        }
      }

      // Get buyer's wallet address
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        toast.error("No wallet address found");
        setIsBuying(false);
        return;
      }

      const buyerAddress = getAddress(accounts[0] as string);

      // If NFT has tokenId, buy on blockchain
      let transactionHash: string | undefined;
      let blockNumber: number | undefined;
      let blockHash: string | undefined;

      if (nft.tokenId && nft.contractAddress && nft.ownerAddress) {
        try {
          // Verify the seller owns the NFT on-chain
          toast.info("Verifying NFT ownership...");
          const ownerCheck = await getNFTOwnerOnChain(BigInt(nft.tokenId));

          if (!ownerCheck.success || !ownerCheck.owner) {
            toast.error("Failed to verify NFT ownership on blockchain");
            setIsBuying(false);
            return;
          }

          // Verify the seller address matches the on-chain owner
          // If there's a mismatch, use the on-chain owner (blockchain is source of truth)
          const onChainOwner = ownerCheck.owner.toLowerCase();
          const dbOwner = nft.ownerAddress?.toLowerCase();

          if (onChainOwner !== dbOwner) {
            // Database owner doesn't match blockchain - use blockchain owner
            console.warn(
              `NFT ownership mismatch. Database owner: ${dbOwner}, Blockchain owner: ${onChainOwner}. Using blockchain owner.`,
            );
            // Continue with blockchain owner - it's the source of truth
          }

          // Use the on-chain owner for the purchase (blockchain is source of truth)
          const actualSellerAddress = ownerCheck.owner;
          const onChainOwnerLower = onChainOwner;
          const buyerAddressLower = buyerAddress.toLowerCase();

          // Check if buyer is trying to buy their own NFT (using blockchain owner as source of truth)
          if (onChainOwnerLower === buyerAddressLower) {
            toast.error(
              "You cannot buy your own NFT. You are the current owner on blockchain.",
            );
            setIsBuying(false);
            return;
          }

          // Step 1: Buyer sends payment to seller
          // Use the actual on-chain owner (blockchain is source of truth)
          // buyNFT will verify ownership again and use blockchain owner
          toast.info("Sending payment to seller...");
          const buyResult = await buyNFT(
            BigInt(nft.tokenId),
            actualSellerAddress, // Pass the blockchain owner
            nft.price,
          );

          if (!buyResult.success) {
            // Check if it's a user rejection
            const isUserRejection =
              buyResult.error?.toLowerCase().includes("rejected") ||
              buyResult.error?.toLowerCase().includes("denied");

            if (isUserRejection) {
              toast.info("Transaction cancelled. No changes were made.");
            } else {
              toast.error(
                buyResult.error || "Failed to purchase on blockchain",
              );
            }
            setIsBuying(false);
            return;
          }

          transactionHash = buyResult.transactionHash;

          // Get transaction receipt for block info
          if (transactionHash) {
            const publicClient = getPublicClient();
            if (publicClient) {
              try {
                const receipt = await publicClient.waitForTransactionReceipt({
                  hash: transactionHash as `0x${string}`,
                });
                blockNumber = Number(receipt.blockNumber);
                // Try to get block hash, but handle errors gracefully
                try {
                  const block = await publicClient.getBlock({
                    blockNumber: receipt.blockNumber,
                  });
                  blockHash = block.hash;
                } catch (blockError) {
                  // Block might not be available - that's okay, we still have the block number
                  console.warn(
                    `Could not fetch block ${receipt.blockNumber.toString()}:`,
                    blockError,
                  );
                }
              } catch (receiptError) {
                console.error(
                  "Error fetching transaction receipt:",
                  receiptError,
                );
                // Continue without block info
              }
            }
          }

          // Step 2: If NFT was auto-transferred, wait for transfer confirmation
          // Otherwise, seller needs to transfer manually
          if (buyResult.transferHash) {
            toast.info("Waiting for NFT transfer confirmation...");
            const publicClient = getPublicClient();
            if (publicClient) {
              try {
                await publicClient.waitForTransactionReceipt({
                  hash: buyResult.transferHash as `0x${string}`,
                });
                toast.success("NFT transferred successfully!");
              } catch (transferError) {
                console.warn("Transfer receipt error:", transferError);
                // Continue anyway - payment was sent
              }
            }
          } else {
            toast.info(
              "Payment sent! The seller will transfer the NFT to you. You can check the transaction on Polygonscan.",
            );
          }

          // Step 3: Verify NFT transfer happened (if auto-transferred)
          // If not auto-transferred, we'll verify ownership before updating database
          if (!buyResult.transferHash) {
            // NFT was not auto-transferred - verify seller still owns it
            // If seller still owns it, they need to transfer manually
            toast.warning(
              "Payment sent! Please wait for the seller to transfer the NFT. The purchase will be completed once the transfer is confirmed.",
            );

            // Wait a moment for any pending transfers, then verify
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Verify the NFT was actually transferred to the buyer
            if (!nft.tokenId) {
              toast.error("NFT tokenId not found");
              setIsBuying(false);
              return;
            }

            const verifyOwner = await getNFTOwnerOnChain(BigInt(nft.tokenId));
            if (verifyOwner.success && verifyOwner.owner) {
              const newOwner = verifyOwner.owner.toLowerCase();
              const buyerLower = buyerAddress.toLowerCase();

              if (newOwner === buyerLower) {
                // Transfer happened! Continue with database update
                toast.success("NFT transfer confirmed! Completing purchase...");
              } else {
                // NFT still with seller - they need to transfer manually
                toast.warning(
                  `Payment sent, but NFT is still owned by ${newOwner.slice(0, 6)}...${newOwner.slice(-4)}. Please contact the seller to complete the transfer, or wait and refresh the page.`,
                );
                setIsBuying(false);
                return; // Don't update database until transfer happens
              }
            } else {
              // Couldn't verify - proceed with caution
              toast.warning(
                "Payment sent, but couldn't verify NFT transfer. Please check the blockchain and refresh if the transfer completed.",
              );
              setIsBuying(false);
              return; // Don't update database if we can't verify
            }
          }

          // Step 4: Update database with purchase will happen in the main flow below
          // The payment has been sent and NFT has been transferred
        } catch (error: unknown) {
          console.error("Blockchain purchase error:", error);

          // Check if user rejected the transaction
          const errorMessage =
            error && typeof error === "object" && "message" in error
              ? String(error.message)
              : "";
          const errorShortMessage =
            error && typeof error === "object" && "shortMessage" in error
              ? String((error as { shortMessage: string }).shortMessage)
              : "";

          const isUserRejection =
            errorMessage.toLowerCase().includes("rejected") ||
            errorMessage.toLowerCase().includes("denied") ||
            errorShortMessage.toLowerCase().includes("rejected") ||
            errorShortMessage.toLowerCase().includes("denied");

          if (isUserRejection) {
            toast.info("Transaction cancelled. No changes were made.");
          } else {
            toast.error(
              "Failed to complete blockchain transaction. Purchase cancelled.",
            );
          }
          setIsBuying(false);
          return;
        }
      }

      // Update database
      const result = await purchaseNFT(
        nft.id,
        buyerAddress,
        transactionHash || "",
        blockNumber,
        blockHash,
      );

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
                isMounted && resolvedTheme === "dark"
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
                        className={`flex items-center gap-2 rounded-full px-4 py-2 flex-shrink-0 transition-all duration-300 disabled:opacity-50 cursor-pointer border shadow-sm hover:shadow-md ${
                          isLiked
                            ? "bg-primary/20 border-primary/40 hover:bg-primary/30"
                            : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:from-primary/20 hover:to-primary/10"
                        }`}
                        title={
                          isLiking
                            ? isLiked
                              ? "Unliking..."
                              : "Liking..."
                            : isLiked
                              ? "Unlike this NFT"
                              : "Like this NFT"
                        }
                      >
                        <Heart
                          className={`w-4 h-4 transition-transform ${
                            isLiked
                              ? "text-primary fill-primary"
                              : "text-primary fill-transparent"
                          } ${isLiking ? "animate-pulse scale-110" : "hover:scale-110"}`}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground text-sm font-medium">
                      Collection:
                    </span>
                    {(() => {
                      const isOwnNFT =
                        currentUserId &&
                        String(currentUserId) === String(nft.userId);
                      if (isOwnNFT) {
                        // Owner can manage collection
                        if (showCollectionSelect) {
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              <select
                                value={collection?.id || ""}
                                onChange={(e) => {
                                  const newCollectionId =
                                    e.target.value || null;
                                  handleUpdateCollection(newCollectionId);
                                }}
                                disabled={isUpdatingCollection}
                                className="bg-background border border-border rounded-lg px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">No Collection</option>
                                {userCollections.map((col) => (
                                  <option key={col.id} value={col.id}>
                                    {col.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => setShowCollectionSelect(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                disabled={isUpdatingCollection}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-2">
                              {collection ? (
                                <>
                                  <Link
                                    href={`/collection/${collection.id}`}
                                    className="text-foreground hover:text-primary transition-colors font-semibold text-sm bg-background/50 px-3 py-1 rounded-lg hover:bg-background"
                                  >
                                    {collection.name}
                                  </Link>
                                  <button
                                    onClick={() =>
                                      setShowCollectionSelect(true)
                                    }
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    title="Change collection"
                                  >
                                    <FolderPlus className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="text-muted-foreground text-sm italic">
                                    Not in a collection
                                  </span>
                                  <button
                                    onClick={() =>
                                      setShowCollectionSelect(true)
                                    }
                                    className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 text-sm font-medium"
                                    title="Add to collection"
                                  >
                                    <FolderPlus className="w-4 h-4" />
                                    Add to Collection
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        }
                      } else {
                        // Not owner - just show collection if it exists
                        if (collection) {
                          return (
                            <Link
                              href={`/collection/${collection.id}`}
                              className="text-foreground hover:text-primary transition-colors font-semibold text-sm bg-background/50 px-3 py-1 rounded-lg hover:bg-background"
                            >
                              {collection.name}
                            </Link>
                          );
                        } else {
                          return (
                            <span className="text-muted-foreground text-sm italic">
                              Not in a collection
                            </span>
                          );
                        }
                      }
                    })()}
                  </div>
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
                      ({parseFloat(nft.price).toFixed(4)} POL)
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
                      <div className="px-5 pb-5 border-t border-border pt-5 bg-background/30">
                        <BlockchainInfo
                          transactionHash={nft.transactionHash}
                          contractAddress={nft.contractAddress}
                          tokenId={nft.tokenId}
                          blockHash={nft.blockHash}
                          blockNumber={nft.blockNumber}
                        />
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
                        <PriceHistory nftId={nft.id} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Action Buttons - Fixed at bottom */}
              <div className="pt-6 border-t border-border mt-auto flex-shrink-0">
                {(() => {
                  const isOwnNFT =
                    currentUserId &&
                    String(currentUserId) === String(nft.userId);

                  if (isOwnNFT) {
                    // Owner actions: List/Unlist
                    if (nft.isListed) {
                      // NFT is listed - show Unlist button
                      return (
                        <div className="space-y-3">
                          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">
                              ✓ Listed for Sale
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Your NFT is available for purchase
                            </p>
                          </div>
                          <Button
                            onClick={async () => {
                              if (!nftId || isUnlisting) return;
                              setIsUnlisting(true);
                              try {
                                const result = await unlistNFT(nftId);
                                if (result.success) {
                                  setNft({ ...nft, isListed: null });
                                  toast.success("NFT unlisted successfully");
                                } else {
                                  toast.error(
                                    result.error || "Failed to unlist NFT",
                                  );
                                }
                              } catch (error) {
                                console.error("Error unlisting NFT:", error);
                                toast.error("Failed to unlist NFT");
                              } finally {
                                setIsUnlisting(false);
                              }
                            }}
                            disabled={isUnlisting}
                            variant="outline"
                            className="w-full gap-2"
                          >
                            {isUnlisting ? (
                              <>
                                <Loader className="w-4 h-4" />
                                Unlisting...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                Unlist NFT
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    } else {
                      // NFT is not listed - show List for Sale button
                      return (
                        <div className="space-y-3">
                          {showListDialog ? (
                            <div className="space-y-3 p-4 bg-background/50 border border-border rounded-lg">
                              <label className="text-sm font-medium text-foreground">
                                Set Price (POL)
                              </label>
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={listPrice}
                                onChange={(e) => setListPrice(e.target.value)}
                                placeholder={nft.price || "0.0000"}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={async () => {
                                    if (
                                      !nftId ||
                                      !listPrice ||
                                      isListing ||
                                      !nft
                                    )
                                      return;
                                    const priceNum = Number(listPrice);
                                    if (isNaN(priceNum) || priceNum <= 0) {
                                      toast.error("Please enter a valid price");
                                      return;
                                    }

                                    // Check if NFT has tokenId (required for blockchain listing)
                                    if (!nft.tokenId || !nft.contractAddress) {
                                      toast.error(
                                        "NFT must be minted on blockchain before listing",
                                      );
                                      return;
                                    }

                                    setIsListing(true);
                                    try {
                                      // Use new lazy listing marketplace (cheap: ~0.01-0.02 POL)
                                      // NFT stays with seller, but enables atomic swaps
                                      const {
                                        listNFT,
                                        checkNFTApproval,
                                        getWalletClient,
                                        getPublicClient,
                                        MARKETPLACE_CONTRACT_ADDRESS,
                                        NFT_CONTRACT_ADDRESS,
                                        PIXEL_MINT_NFT_ABI,
                                      } = await import("@/lib/blockchain");

                                      const walletClient = getWalletClient();
                                      if (!walletClient) {
                                        toast.error(
                                          "Please connect your wallet",
                                        );
                                        setIsListing(false);
                                        return;
                                      }

                                      const [account] =
                                        await walletClient.getAddresses();
                                      if (!account) {
                                        toast.error("No wallet account found");
                                        setIsListing(false);
                                        return;
                                      }

                                      if (
                                        !MARKETPLACE_CONTRACT_ADDRESS ||
                                        !NFT_CONTRACT_ADDRESS
                                      ) {
                                        toast.error("Contracts not configured");
                                        setIsListing(false);
                                        return;
                                      }

                                      // Step 1: Check if already approved (one-time, ~0.01 POL)
                                      const publicClient = getPublicClient();
                                      let needsApproval = true;
                                      if (publicClient && nft.tokenId) {
                                        try {
                                          const approvalCheck =
                                            await checkNFTApproval(
                                              BigInt(nft.tokenId),
                                              account,
                                              MARKETPLACE_CONTRACT_ADDRESS,
                                            );
                                          needsApproval = !(
                                            approvalCheck.success &&
                                            approvalCheck.isApproved
                                          );
                                        } catch (error) {
                                          console.warn(
                                            "Could not check approval:",
                                            error,
                                          );
                                        }
                                      }

                                      // Step 2: Approve marketplace if needed (one-time, ~0.01 POL)
                                      if (needsApproval) {
                                        toast.info(
                                          "Approving marketplace (one-time, ~0.01 POL). This enables atomic swaps.",
                                        );
                                        // Always use the NFT_CONTRACT_ADDRESS from env, not from database
                                        // Database might have old/incorrect contract addresses
                                        const nftContractAddress =
                                          NFT_CONTRACT_ADDRESS as `0x${string}`;

                                        if (!nftContractAddress) {
                                          toast.error(
                                            "NFT contract address not configured",
                                          );
                                          setIsListing(false);
                                          return;
                                        }

                                        try {
                                          // Verify contract addresses are valid
                                          if (
                                            !nftContractAddress ||
                                            !MARKETPLACE_CONTRACT_ADDRESS
                                          ) {
                                            toast.error(
                                              "Contract addresses not configured",
                                            );
                                            setIsListing(false);
                                            return;
                                          }

                                          // Retry logic for approval with RPC error handling
                                          let approvalAttempts = 0;
                                          const maxApprovalAttempts = 3;
                                          let approvalSuccess = false;

                                          while (
                                            approvalAttempts <
                                              maxApprovalAttempts &&
                                            !approvalSuccess
                                          ) {
                                            try {
                                              approvalAttempts++;

                                              // Simulate the transaction first to catch errors early (only on first attempt)
                                              if (
                                                approvalAttempts === 1 &&
                                                publicClient
                                              ) {
                                                try {
                                                  await publicClient.simulateContract(
                                                    {
                                                      address:
                                                        nftContractAddress,
                                                      abi: PIXEL_MINT_NFT_ABI,
                                                      functionName:
                                                        "setApprovalForAll",
                                                      args: [
                                                        MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                                                        true,
                                                      ],
                                                      account,
                                                    },
                                                  );
                                                } catch (simulateError) {
                                                  console.error(
                                                    "Simulation error:",
                                                    simulateError,
                                                  );
                                                  const simErrorMsg =
                                                    simulateError &&
                                                    typeof simulateError ===
                                                      "object" &&
                                                    "message" in simulateError
                                                      ? String(
                                                          simulateError.message,
                                                        )
                                                      : "";

                                                  // Don't retry on revert errors (these are real contract errors)
                                                  if (
                                                    simErrorMsg.includes(
                                                      "revert",
                                                    ) ||
                                                    simErrorMsg.includes(
                                                      "execution reverted",
                                                    )
                                                  ) {
                                                    toast.error(
                                                      "Cannot approve marketplace. Please check: 1) You own NFTs from this contract, 2) Contract address is correct, 3) You have sufficient POL for gas.",
                                                    );
                                                    setIsListing(false);
                                                    return;
                                                  }

                                                  // For RPC errors, continue to retry
                                                  if (
                                                    !simErrorMsg.includes(
                                                      "Internal JSON-RPC error",
                                                    ) &&
                                                    !simErrorMsg.includes(
                                                      "timeout",
                                                    ) &&
                                                    !simErrorMsg.includes(
                                                      "network",
                                                    )
                                                  ) {
                                                    throw simulateError;
                                                  }
                                                }
                                              }

                                              await walletClient.writeContract({
                                                address: nftContractAddress,
                                                abi: PIXEL_MINT_NFT_ABI,
                                                functionName:
                                                  "setApprovalForAll",
                                                args: [
                                                  MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                                                  true,
                                                ],
                                                account,
                                              });
                                              approvalSuccess = true;
                                              toast.success(
                                                "Marketplace approved!",
                                              );
                                              break; // Success, exit retry loop
                                            } catch (approvalError: unknown) {
                                              const errorMessage =
                                                approvalError &&
                                                typeof approvalError ===
                                                  "object" &&
                                                "message" in approvalError
                                                  ? String(
                                                      approvalError.message,
                                                    )
                                                  : "";

                                              const shortMessage =
                                                approvalError &&
                                                typeof approvalError ===
                                                  "object" &&
                                                "shortMessage" in approvalError
                                                  ? String(
                                                      (
                                                        approvalError as {
                                                          shortMessage: string;
                                                        }
                                                      ).shortMessage,
                                                    )
                                                  : "";

                                              const fullError =
                                                errorMessage ||
                                                shortMessage ||
                                                "";

                                              // Don't retry on user rejection or revert errors
                                              if (
                                                fullError
                                                  .toLowerCase()
                                                  .includes("rejected") ||
                                                fullError
                                                  .toLowerCase()
                                                  .includes("denied") ||
                                                fullError
                                                  .toLowerCase()
                                                  .includes("user rejected") ||
                                                fullError.includes(
                                                  "execution reverted",
                                                ) ||
                                                fullError.includes("revert")
                                              ) {
                                                if (
                                                  fullError.includes(
                                                    "revert",
                                                  ) ||
                                                  fullError.includes(
                                                    "execution reverted",
                                                  )
                                                ) {
                                                  toast.error(
                                                    "Approval failed. Please verify: 1) You own NFTs from this contract, 2) Contract addresses are correct, 3) You have sufficient POL for gas.",
                                                  );
                                                } else {
                                                  toast.info(
                                                    "Approval cancelled",
                                                  );
                                                }
                                                setIsListing(false);
                                                return;
                                              }

                                              // Retry on RPC errors
                                              if (
                                                (fullError.includes(
                                                  "Internal JSON-RPC error",
                                                ) ||
                                                  fullError.includes(
                                                    "timeout",
                                                  ) ||
                                                  fullError.includes(
                                                    "network",
                                                  ) ||
                                                  fullError.includes(
                                                    "ECONNREFUSED",
                                                  ) ||
                                                  fullError.includes(
                                                    "fetch failed",
                                                  )) &&
                                                approvalAttempts <
                                                  maxApprovalAttempts
                                              ) {
                                                console.warn(
                                                  `RPC error during approval, retrying (${approvalAttempts}/${maxApprovalAttempts})...`,
                                                );
                                                await new Promise((resolve) =>
                                                  setTimeout(
                                                    resolve,
                                                    2000 *
                                                      Math.pow(
                                                        2,
                                                        approvalAttempts - 1,
                                                      ),
                                                  ),
                                                );
                                                continue; // Retry
                                              }

                                              // For other errors or if we've exhausted attempts, throw
                                              throw approvalError;
                                            }
                                          }

                                          if (!approvalSuccess) {
                                            toast.error(
                                              "Failed to approve marketplace after multiple attempts due to RPC errors. Please try again later or check your network connection.",
                                            );
                                            setIsListing(false);
                                            return;
                                          }
                                        } catch (approvalError) {
                                          console.error(
                                            "Approval error:",
                                            approvalError,
                                          );
                                          const errorMessage =
                                            approvalError &&
                                            typeof approvalError === "object" &&
                                            "message" in approvalError
                                              ? String(approvalError.message)
                                              : "";

                                          toast.error(
                                            `Approval failed: ${errorMessage || "Unknown error"}`,
                                          );
                                          setIsListing(false);
                                          return;
                                        }
                                      }

                                      // Step 3: List NFT on marketplace (~0.01-0.02 POL with lazy listing)
                                      // NFT stays with seller, but enables atomic swaps
                                      toast.info(
                                        "Listing NFT on marketplace (~0.01-0.02 POL). This enables atomic swaps!",
                                      );
                                      const listResult = await listNFT(
                                        BigInt(nft.tokenId),
                                        listPrice,
                                      );

                                      if (!listResult.success) {
                                        toast.error(
                                          listResult.error ||
                                            "Failed to list on marketplace",
                                        );
                                        setIsListing(false);
                                        return;
                                      }

                                      // Wait for transaction confirmation
                                      if (
                                        listResult.transactionHash &&
                                        publicClient
                                      ) {
                                        toast.info(
                                          "Waiting for transaction confirmation...",
                                        );
                                        try {
                                          await publicClient.waitForTransactionReceipt(
                                            {
                                              hash: listResult.transactionHash as `0x${string}`,
                                            },
                                          );
                                          toast.success(
                                            "NFT listed on marketplace!",
                                          );
                                        } catch (receiptError) {
                                          console.warn(
                                            "Receipt error:",
                                            receiptError,
                                          );
                                        }
                                      }

                                      // Step 4: Update database
                                      const result = await listNFTForSale(
                                        nftId,
                                        listPrice,
                                      );
                                      if (result.success) {
                                        setNft({
                                          ...nft,
                                          price: listPrice,
                                          isListed: new Date(),
                                        });
                                        setShowListDialog(false);
                                        setListPrice("");
                                        toast.success(
                                          "NFT listed! Buyers can now purchase with atomic swaps (payment + transfer in one transaction).",
                                        );
                                        await loadNFTDetails();
                                      } else {
                                        toast.error(
                                          result.error ||
                                            "Failed to update database",
                                        );
                                      }
                                    } catch (error) {
                                      console.error(
                                        "Error listing NFT:",
                                        error,
                                      );
                                      const errorMessage =
                                        error &&
                                        typeof error === "object" &&
                                        "message" in error
                                          ? String(error.message)
                                          : "";
                                      const shortMessage =
                                        error &&
                                        typeof error === "object" &&
                                        "shortMessage" in error
                                          ? String(
                                              (
                                                error as {
                                                  shortMessage: string;
                                                }
                                              ).shortMessage,
                                            )
                                          : "";

                                      const fullError =
                                        errorMessage ||
                                        shortMessage ||
                                        "Unknown error";

                                      if (
                                        fullError
                                          .toLowerCase()
                                          .includes("rejected") ||
                                        fullError
                                          .toLowerCase()
                                          .includes("denied")
                                      ) {
                                        toast.info("Transaction cancelled");
                                      } else {
                                        toast.error(
                                          `Failed to list NFT: ${fullError}`,
                                        );
                                        console.error(
                                          "Full error details:",
                                          error,
                                        );
                                      }
                                    } finally {
                                      setIsListing(false);
                                    }
                                  }}
                                  disabled={isListing || !listPrice}
                                  className="flex-1 gap-2"
                                >
                                  {isListing ? (
                                    <>
                                      <Loader className="w-4 h-4" />
                                      Listing...
                                    </>
                                  ) : (
                                    <>
                                      <Tag className="w-4 h-4" />
                                      List for Sale
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={() => {
                                    setShowListDialog(false);
                                    setListPrice("");
                                  }}
                                  variant="outline"
                                  disabled={isListing}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => {
                                setListPrice(nft.price || "");
                                setShowListDialog(true);
                              }}
                              className="w-full gap-2"
                            >
                              <Tag className="w-4 h-4" />
                              List for Sale / Resell
                            </Button>
                          )}
                        </div>
                      );
                    }
                  } else {
                    // Not owner - show Buy button if listed
                    if (nft.isListed) {
                      return (
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
                              <span>
                                Buy Now for {parseFloat(nft.price).toFixed(4)}{" "}
                                POL
                              </span>
                            </>
                          )}
                        </Button>
                      );
                    } else {
                      return (
                        <div className="p-4 bg-muted/50 border border-border rounded-lg text-center">
                          <p className="text-muted-foreground text-sm">
                            This NFT is not currently for sale
                          </p>
                        </div>
                      );
                    }
                  }
                })()}
              </div>
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
