"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, X, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createNFT, updateNFTBlockchainInfo } from "@/actions/nft.actions";
import type { Collection } from "@/actions/collection.actions";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { isPolygonAmoyNetwork, switchToPolygonAmoy } from "@/lib/networks";
import { getAddress } from "viem";
import { NFT_CONTRACT_ADDRESS, mintNFT } from "@/lib/blockchain";

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  walletAddress?: string | null;
};

type CreateNFTClientProps = {
  user: User;
  collections: Collection[];
};

const nftSchema = z.object({
  name: z.string().min(1, "Please enter an NFT name").trim(),
  description: z.string().min(1, "Please enter a description").trim(),
  price: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Please enter a valid price" },
  ),
  collectionId: z.string().min(1, "Please select a collection"),
  imageFile: z
    .instanceof(File, { message: "Please upload your artwork" })
    .refine(
      (file) => {
        const validTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/svg+xml",
          "image/webm",
          "video/mp4",
          "video/webm",
          "audio/wav",
          "audio/ogg",
          "model/gltf-binary",
          "model/gltf+json",
        ];
        return validTypes.includes(file.type);
      },
      { message: "Unsupported file type" },
    )
    .refine((file) => file.size <= 100 * 1024 * 1024, {
      message: "File size must be less than 100MB",
    }),
});

type NFTFormData = z.infer<typeof nftSchema>;

export default function CreateNFTClient({
  user,
  collections,
}: CreateNFTClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [_, setIsMinting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(
    user.walletAddress || null,
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(searchParams.get("collection") || null);

  const selectedCollection = collections.find(
    (c) => c.id === selectedCollectionId,
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NFTFormData>({
    resolver: zodResolver(nftSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      collectionId: selectedCollectionId || "",
    },
  });

  useEffect(() => {
    if (selectedCollectionId) {
      setValue("collectionId", selectedCollectionId);
    }
  }, [selectedCollectionId, setValue]);

  const watchedPrice = watch("price");

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setValue("imageFile", null as any, { shouldValidate: true });
      setImagePreview(null);
      return;
    }

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/webm",
      "video/mp4",
      "video/webm",
      "audio/wav",
      "audio/ogg",
      "model/gltf-binary",
      "model/gltf+json",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error(
        "Unsupported file type. Supported formats: JPG, PNG, GIF, SVG, WEBM, MP3, MP4, WAV, OGG, GLB, GLTF",
      );
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size must be less than 100MB");
      return;
    }

    setValue("imageFile", file, { shouldValidate: true });
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0] || null;
    handleImageChange(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    handleImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCollectionSelect = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    router.push(`/create-nft?collection=${collectionId}`);
  };

  const connectWallet = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        toast.error(
          "MetaMask is not installed. Please install MetaMask to continue.",
        );
        return;
      }

      // Check if user is on Polygon Amoy network
      const isOnPolygonAmoy = await isPolygonAmoyNetwork();
      if (!isOnPolygonAmoy) {
        toast.info("Switching to Polygon Amoy network...");
        const switched = await switchToPolygonAmoy();
        if (!switched) {
          toast.error(
            "Please switch to Polygon Amoy network manually in MetaMask",
          );
          return;
        }
      }

      // Request account access
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        toast.error("No wallet address found");
        return;
      }

      const address = accounts[0];
      if (!address) {
        toast.error("No wallet address found");
        return;
      }
      const normalizedAddress = getAddress(address);
      setWalletAddress(normalizedAddress);
      toast.success("Wallet connected!");
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      if (error.code === 4001) {
        toast.error("Please connect to MetaMask");
      } else {
        toast.error("Failed to connect wallet. Please try again.");
      }
    }
  };

  const onSubmit = async (data: NFTFormData) => {
    if (!data.collectionId) {
      toast.error("Please select a collection");
      return;
    }
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      await connectWallet();
      return;
    }

    setIsLoading(true);
    setIsUploading(true);

    try {
      const {
        success,
        error: createError,
        nftId,
        tokenURI,
      } = await createNFT(
        data.name,
        data.description,
        data.imageFile,
        data.price,
        data.collectionId,
        walletAddress,
        undefined, // transactionHash - will be set after minting
        undefined, // tokenId - will be set after minting
        NFT_CONTRACT_ADDRESS, // contractAddress
      );

      setIsUploading(false);

      if (!success || !nftId) {
        toast.error(createError || "Failed to create NFT");
        setIsLoading(false);
        return;
      }

      if (!tokenURI) {
        toast.error("Failed to get token URI from IPFS");
        setIsLoading(false);
        return;
      }

      toast.info("Minting NFT on blockchain...");
      setIsMinting(true);

      const mintResult = await mintNFT(walletAddress, tokenURI);

      if (!mintResult.success || !mintResult.transactionHash) {
        toast.warning(
          mintResult.error ||
            "Failed to mint on blockchain, but NFT is stored on IPFS",
        );
        setIsMinting(false);
        setIsLoading(false);
        if (user.id) {
          router.push(`/profile/${user.id}`);
        } else {
          router.push("/");
        }
        return;
      }

      if (mintResult.transactionHash && mintResult.tokenId) {
        const updateResult = await updateNFTBlockchainInfo(
          nftId,
          mintResult.tokenId.toString(),
          mintResult.transactionHash,
          mintResult.blockNumber,
          mintResult.blockHash,
        );

        if (!updateResult.success) {
          console.error(
            "Failed to update NFT with blockchain info:",
            updateResult.error,
          );
        }

        try {
          const {
            listNFT,
            checkNFTApproval,
            getWalletClient,
            getPublicClient,
            MARKETPLACE_CONTRACT_ADDRESS,
            NFT_CONTRACT_ADDRESS,
            PIXEL_MINT_NFT_ABI,
          } = await import("@/lib/blockchain");

          if (MARKETPLACE_CONTRACT_ADDRESS && NFT_CONTRACT_ADDRESS) {
            const walletClient = getWalletClient();
            const publicClient = getPublicClient();

            if (walletClient && publicClient) {
              const [account] = await walletClient.getAddresses();
              if (account) {
                let needsApproval = true;
                try {
                  const approvalCheck = await checkNFTApproval(
                    mintResult.tokenId,
                    account,
                    MARKETPLACE_CONTRACT_ADDRESS,
                  );
                  needsApproval = !(
                    approvalCheck.success && approvalCheck.isApproved
                  );
                } catch (error) {
                  console.warn("Could not check approval:", error);
                }

                if (needsApproval) {
                  toast.info(
                    "Approving marketplace (one-time, ~0.01 POL) for atomic swaps...",
                  );
                  try {
                    if (
                      !NFT_CONTRACT_ADDRESS ||
                      !MARKETPLACE_CONTRACT_ADDRESS
                    ) {
                      toast.error("Contract addresses not configured");
                    } else {
                      try {
                        await publicClient.simulateContract({
                          address: NFT_CONTRACT_ADDRESS as `0x${string}`,
                          abi: PIXEL_MINT_NFT_ABI,
                          functionName: "setApprovalForAll",
                          args: [
                            MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                            true,
                          ],
                          account,
                        });
                      } catch (simulateError) {
                        console.warn("Simulation error:", simulateError);
                        const simErrorMsg =
                          simulateError &&
                          typeof simulateError === "object" &&
                          "message" in simulateError
                            ? String(simulateError.message)
                            : "";

                        if (
                          simErrorMsg.includes("revert") ||
                          simErrorMsg.includes("execution reverted")
                        ) {
                          toast.warning(
                            "Cannot approve marketplace. Listing will be skipped. You can approve and list later from the NFT details page.",
                          );
                          return;
                        }
                        throw simulateError;
                      }

                      await walletClient.writeContract({
                        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
                        abi: PIXEL_MINT_NFT_ABI,
                        functionName: "setApprovalForAll",
                        args: [
                          MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                          true,
                        ],
                        account,
                      });
                      toast.success("Marketplace approved!");
                    }
                  } catch (approvalError) {
                    console.warn(
                      "Failed to approve marketplace:",
                      approvalError,
                    );
                    const errorMessage =
                      approvalError &&
                      typeof approvalError === "object" &&
                      "message" in approvalError
                        ? String(approvalError.message)
                        : "";

                    if (
                      errorMessage.toLowerCase().includes("rejected") ||
                      errorMessage.toLowerCase().includes("denied")
                    ) {
                      toast.info(
                        "Approval cancelled. NFT created but not listed. You can approve and list later from the NFT details page.",
                      );
                    } else {
                      toast.warning(
                        "Approval failed. NFT created but not listed. You can approve and list later from the NFT details page. Error: " +
                          errorMessage,
                      );
                    }
                    return;
                  }
                }

                toast.info(
                  "Waiting for mint to be confirmed before listing...",
                );
                await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

                toast.info(
                  "Listing NFT on marketplace (~0.01-0.02 POL). This enables atomic swaps!",
                );
                const listResult = await listNFT(
                  mintResult.tokenId,
                  data.price,
                );

                if (listResult.success) {
                  if (listResult.transactionHash && publicClient) {
                    toast.info("Waiting for transaction confirmation...");
                    try {
                      await publicClient.waitForTransactionReceipt({
                        hash: listResult.transactionHash as `0x${string}`,
                      });
                    } catch (receiptError) {
                      console.warn("Receipt error:", receiptError);
                    }
                  }

                  // Update database to reflect listing
                  const { listNFTForSale } = await import(
                    "@/actions/nft.actions"
                  );
                  const dbResult = await listNFTForSale(nftId, data.price);
                  if (dbResult.success) {
                    toast.success(
                      "NFT listed on marketplace! Buyers can purchase with atomic swaps.",
                    );
                  } else {
                    toast.warning(
                      "NFT listed on marketplace, but database update failed. The listing is active on-chain.",
                    );
                  }
                } else {
                  console.warn(
                    "Failed to list on marketplace:",
                    listResult.error,
                  );
                  toast.warning(
                    "NFT created but not listed on marketplace. You can list it later from the NFT details page. Error: " +
                      (listResult.error || "Unknown error"),
                  );
                }
              }
            }
          }
        } catch (listingError) {
          console.warn(
            "Failed to list NFT on marketplace (NFT still created):",
            listingError,
          );
        }
      } else if (mintResult.transactionHash) {
        toast.warning(
          "NFT minted but tokenId not available. Transaction hash saved.",
        );
      }

      setIsMinting(false);
      toast.success("NFT created and minted on blockchain successfully!");

      if (user.id) {
        router.push(`/profile/${user.id}`);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error creating NFT:", error);
      toast.error("Failed to create NFT. Please try again.");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
      setIsMinting(false);
    }
  };

  const imageFile = watch("imageFile");

  if (!selectedCollectionId || !selectedCollection) {
    return (
      <div className="relative min-h-screen w-full bg-background">
        <main className="px-4 sm:px-8 lg:px-[120px] pt-[120px] pb-[100px] max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Select Collection</span>
          </div>

          {/* Page Title */}
          <div className="text-center mb-8 mt-5 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-foreground text-3xl sm:text-4xl font-semibold mb-2">
              Select a Collection
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Choose a collection to add your NFT to, or create a new one.
            </p>
          </div>

          {collections.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center animate-in fade-in slide-in-from-left-4 duration-700">
              <p className="text-foreground text-lg font-medium mb-4">
                You don't have any collections yet
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                Create a collection first to organize your NFTs
              </p>
              <Link href="/create-collection">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Collection
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleCollectionSelect(collection.id)}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-foreground/50 transition-all text-left group"
                >
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-background">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-foreground text-lg font-semibold mb-2">
                    {collection.name}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {collection.description}
                  </p>
                </button>
              ))}
              <Link
                href="/create-collection"
                className="bg-card border-2 border-dashed border-border rounded-2xl p-6 hover:border-foreground/50 transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center mb-4 group-hover:border-foreground/50 transition-colors">
                  <Plus className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <h3 className="text-foreground text-lg font-semibold mb-2">
                  Create New Collection
                </h3>
                <p className="text-muted-foreground text-sm">
                  Start a new collection
                </p>
              </Link>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-background">
      <main className="px-4 sm:px-8 lg:px-[120px] pt-[120px] pb-[100px] max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => {
              setSelectedCollectionId(null);
              router.push("/create-nft");
            }}
            className="hover:text-foreground transition-colors"
          >
            Collections
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{selectedCollection.name}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Create NFT</span>
        </div>

        {/* Page Title */}
        <div className="text-center mb-8 mt-5 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-foreground text-3xl sm:text-4xl font-semibold mb-2">
            Create New NFT
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Follow the steps below to mint and list your artwork in{" "}
            <span className="text-foreground font-medium">
              {selectedCollection.name}
            </span>
            .
          </p>
          {/* Wallet Connection */}
          {!walletAddress && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Connect your wallet to mint NFTs on blockchain
              </p>
              <Button onClick={connectWallet} variant="outline" size="sm">
                Connect Wallet
              </Button>
            </div>
          )}
          {walletAddress && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Wallet:{" "}
                <span className="text-foreground font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Upload Artwork */}
          <div className="bg-card border border-border rounded-2xl p-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-foreground rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <span className="text-background font-medium text-lg">1</span>
              </div>
              <div className="flex-1">
                <h2 className="text-foreground text-lg font-semibold mb-1">
                  Upload your artwork
                </h2>
                <p className="text-muted-foreground text-xs">
                  Upload the file you want to turn into an NFT. Supported
                  formats: JPG, PNG, GIF, SVG, WEBM, MP3, MP4, WAV, OGG, GLB,
                  GLTF.
                </p>
              </div>
            </div>

            <Controller
              name="imageFile"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative border-2 border-dashed rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-foreground bg-foreground/10"
                        : "border-border bg-card"
                    } ${imagePreview ? "" : "hover:border-foreground/50"} ${
                      errors.imageFile ? "border-destructive" : ""
                    }`}
                    onClick={() =>
                      !imagePreview && fileInputRef.current?.click()
                    }
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        {imageFile?.type.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imagePreview}
                            alt="NFT preview"
                            className="w-full h-full object-contain rounded-xl"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-foreground/70">
                              {imageFile?.name || "File uploaded"}
                            </p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage();
                          }}
                          className="absolute top-2 right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1.5 transition-all shadow-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-foreground mb-3" />
                        <p className="text-foreground text-base font-medium mb-1">
                          Upload file
                        </p>
                        <p className="text-muted-foreground text-sm">
                          or drag and drop
                        </p>
                        <p className="text-muted-foreground/60 text-xs mt-2">
                          PNG, JPG, GIF up to 100MB
                        </p>
                      </>
                    )}
                  </div>
                  {errors.imageFile && (
                    <p className="text-destructive text-xs mt-2">
                      {errors.imageFile.message}
                    </p>
                  )}
                  <input
                    {...field}
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*,.glb,.gltf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleImageChange(file);
                    }}
                    className="hidden"
                  />
                </>
              )}
            />
          </div>

          {/* Step 2: Add Details */}
          <div className="bg-card border border-border rounded-2xl p-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-foreground rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <span className="text-background font-medium text-lg">2</span>
              </div>
              <div className="flex-1">
                <h2 className="text-foreground text-lg font-semibold mb-1">
                  Add details
                </h2>
                <p className="text-muted-foreground text-xs">
                  Give your NFT a name and a description.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-foreground text-sm font-medium block mb-2">
                  Name
                </label>
                <input
                  {...register("name")}
                  type="text"
                  placeholder='e.g. "CryptoPunk #1034"'
                  className={`w-full bg-background border rounded-lg h-11 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all ${
                    errors.name ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.name && (
                  <p className="text-destructive text-xs mt-2">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-foreground text-sm font-medium block mb-2">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  placeholder="Provide a detailed description of your item."
                  className={`w-full bg-background border rounded-lg h-24 p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all resize-none ${
                    errors.description ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.description && (
                  <p className="text-destructive text-xs mt-2">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Collection Display (read-only) */}
              <div>
                <label className="text-foreground text-sm font-medium block mb-2">
                  Collection
                </label>
                <div className="w-full bg-background border border-border rounded-lg h-11 px-4 flex items-center text-foreground">
                  {selectedCollection.name}
                </div>
                <input
                  type="hidden"
                  {...register("collectionId")}
                  value={selectedCollectionId}
                />
                {errors.collectionId && (
                  <p className="text-destructive text-xs mt-2">
                    {errors.collectionId.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Set Price */}
          <div className="bg-card border border-border rounded-2xl p-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-foreground rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <span className="text-background font-medium text-lg">3</span>
              </div>
              <div className="flex-1">
                <h2 className="text-foreground text-lg font-semibold mb-1">
                  Set a price
                </h2>
                <p className="text-muted-foreground text-xs">
                  Enter the price for your NFT.
                </p>
              </div>
            </div>

            <div>
              <label className="text-foreground text-sm font-medium block mb-2">
                Price
              </label>
              <div className="relative">
                <input
                  {...register("price")}
                  type="number"
                  placeholder="0.08"
                  step="0.001"
                  min="0"
                  className={`w-full bg-background border rounded-lg h-11 pl-4 pr-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    errors.price ? "border-destructive" : "border-border"
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-foreground text-sm">POL</span>
                  <span className="text-muted-foreground text-sm">
                    {watchedPrice
                      ? `($${(parseFloat(watchedPrice) * 2495.78).toFixed(2)})`
                      : "($0.00)"}
                  </span>
                </div>
              </div>
              {errors.price && (
                <p className="text-destructive text-xs mt-2">
                  {errors.price.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg h-11 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader size="sm" />
                <span>
                  {isUploading
                    ? "Uploading artwork..."
                    : "Creating & Listing NFT..."}
                </span>
              </div>
            ) : (
              "Create & List NFT"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
