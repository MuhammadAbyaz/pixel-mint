"use client";
import React, { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { uploadNFTImage, createNFT } from "@/actions/nft.actions";
import type { Collection } from "@/actions/collection.actions";

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type CreateNFTClientProps = {
  user: User;
  collections: Collection[];
};

export default function CreateNFTClient({
  user,
  collections,
}: CreateNFTClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

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

    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size must be less than 100MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter an NFT name");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (!imageFile) {
      toast.error("Please upload your artwork");
      return;
    }

    setIsLoading(true);

    try {
      // Upload image to Supabase
      const formData = new FormData();
      formData.append("image", imageFile);

      const { url: imageUrl, error: uploadError } =
        await uploadNFTImage(formData);

      if (uploadError || !imageUrl) {
        toast.error(uploadError || "Failed to upload artwork");
        setIsLoading(false);
        return;
      }

      // Create NFT in database
      const { success, error: createError } = await createNFT(
        name,
        description,
        imageUrl,
        price,
        selectedCollection || undefined,
      );

      if (!success) {
        toast.error(createError || "Failed to create NFT");
        setIsLoading(false);
        return;
      }

      toast.success("NFT created and listed successfully!");
      router.push(`/profile/${user.id}`);
    } catch (error) {
      console.error("Error creating NFT:", error);
      toast.error("Failed to create NFT. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black">
      <main className="px-4 sm:px-8 lg:px-[120px] pt-[120px] pb-[100px] max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-10 mt-5 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-white text-4xl font-normal mb-3">
            Create New NFT
          </h1>
          <p className="text-white/60 text-base">
            Follow the steps below to mint and list your artwork.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Upload Artwork */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-[#037ae5] rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-lg">1</span>
              </div>
              <div className="flex-1">
                <h2 className="text-white text-xl font-semibold mb-1">
                  Upload your artwork
                </h2>
                <p className="text-white/50 text-sm">
                  Upload the file you want to turn into an NFT. Supported
                  formats: JPG, PNG, GIF, SVG, WEBM, MP3, MP4, WAV, OGG, GLB,
                  GLTF.
                </p>
              </div>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-xl h-[200px] flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? "border-[#037ae5] bg-[#037ae5]/10"
                  : "border-[#413c3c] bg-[#141414]"
              } ${imagePreview ? "" : "hover:border-[#037ae5]/50"}`}
              onClick={() => !imagePreview && fileInputRef.current?.click()}
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
                      <p className="text-white/70">
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
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-[#037ae5] mb-3" />
                  <p className="text-[#037ae5] text-base font-medium mb-1">
                    Upload file
                  </p>
                  <p className="text-white/50 text-sm">or drag and drop</p>
                  <p className="text-white/30 text-xs mt-2">
                    PNG, JPG, GIF up to 100MB
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.glb,.gltf"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Step 2: Add Details */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-[#037ae5] rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-lg">2</span>
              </div>
              <div className="flex-1">
                <h2 className="text-white text-xl font-semibold mb-1">
                  Add details
                </h2>
                <p className="text-white/50 text-sm">
                  Give your NFT a name and a description.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white text-sm block mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='e.g. "CryptoPunk #1034"'
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-12 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#037ae5] transition-colors"
                />
              </div>

              <div>
                <label className="text-white text-sm block mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed description of your item."
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-24 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#037ae5] transition-colors resize-none"
                />
              </div>

              {/* Collection Selection */}
              {collections.length > 0 && (
                <div>
                  <label className="text-white text-sm block mb-2">
                    Collection (Optional)
                  </label>
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-12 px-4 text-white focus:outline-none focus:border-[#037ae5] transition-colors"
                  >
                    <option value="">No collection</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Set Price */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-[#037ae5] rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-lg">3</span>
              </div>
              <div className="flex-1">
                <h2 className="text-white text-xl font-semibold mb-1">
                  Set a price
                </h2>
                <p className="text-white/50 text-sm">
                  Enter the price for your NFT.
                </p>
              </div>
            </div>

            <div>
              <label className="text-white text-sm block mb-2">Price</label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.08"
                  step="0.001"
                  min="0"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-12 pl-4 pr-24 text-white placeholder:text-white/30 focus:outline-none focus:border-[#037ae5] transition-colors"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-white text-sm">ETH</span>
                  <span className="text-white/30 text-sm">
                    {price
                      ? `($${(parseFloat(price) * 2495.78).toFixed(2)})`
                      : "($0.00)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#037ae5] hover:bg-[#5558e3] text-white text-lg font-medium rounded-xl h-14 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating & Listing NFT...</span>
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
