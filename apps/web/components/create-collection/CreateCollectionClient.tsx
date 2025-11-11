"use client";
import React, { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  uploadCollectionImage,
  createCollection,
} from "@/actions/collection.actions";

// Image constants from Figma
const imgLayer1 =
  "https://www.figma.com/api/mcp/asset/0d6a0ec9-e2f4-41ff-9890-bee727d9ede1";

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type CreateCollectionClientProps = {
  user: User;
};

export default function CreateCollectionClient({
  user,
}: CreateCollectionClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only PNG, JPEG, and SVG files are supported");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
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
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only PNG, JPEG, and SVG files are supported");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
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
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddCategory = () => {
    const category = prompt("Enter category name:");
    if (category && category.trim()) {
      setCategories([...categories, category.trim()]);
    }
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (!imageFile) {
      toast.error("Please upload a collection image");
      return;
    }

    setIsLoading(true);

    try {
      // Upload image to Supabase
      const formData = new FormData();
      formData.append("image", imageFile);

      const { url: imageUrl, error: uploadError } =
        await uploadCollectionImage(formData);

      if (uploadError || !imageUrl) {
        toast.error(uploadError || "Failed to upload image");
        setIsLoading(false);
        return;
      }

      // Create collection in database
      const { success, error: createError } = await createCollection(
        name,
        description,
        imageUrl,
        categories,
      );

      if (!success) {
        toast.error(createError || "Failed to create collection");
        setIsLoading(false);
        return;
      }

      toast.success("Collection created successfully!");
      router.push(`/profile/${user.id}`);
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="relative min-h-screen w-full bg-black">
      <main className="px-4 sm:px-8 lg:px-[144px] pt-[131px] pb-[100px]">
        {/* Tabs */}
        <div className="flex justify-center items-center gap-[170px] mb-[51px] relative">
          <button
            className={`text-3xl transition-colors ${"text-white font-bold"}`}
          >
            Create New Collection
          </button>

          {/* Tab Indicator Line */}
          <div className="absolute bottom-[-20px] left-0 right-0 h-[1px] bg-white/10" />
          <div
            className={`absolute bottom-[-23px] h-[3px] bg-[#037ae5] transition-all duration-300`}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-[1154px] mx-auto">
          {/* Collection Image */}
          <div className="mb-[56px]">
            <label className="text-white text-lg block mb-[31px]">
              Collection Image *
            </label>
            <p className="text-[#9e9999] text-base mb-[20px]">
              Only support png, jpeg, svg
            </p>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="relative bg-[#141414] border border-dashed border-[#413c3c] rounded-[10px] h-[267px] flex flex-col items-center justify-center cursor-pointer group hover:border-[#037ae5]/50 transition-colors"
              onClick={() => !imagePreview && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Collection preview"
                    className="w-full h-full object-contain rounded-[10px]"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgLayer1}
                    alt="Upload icon"
                    className="w-[70px] h-[81px] mb-4"
                  />
                  <p className="text-[#b9b7b7] text-base mb-[18px]">
                    Drag & drop your file
                  </p>
                  <p className="text-[#b9b7b7] text-base mb-[19px]">OR</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="bg-[#141414] border border-[#b9b7b7] rounded-[10px] px-6 py-2 text-[#b9b7b7] text-base hover:border-[#037ae5] hover:text-[#037ae5] transition-colors"
                  >
                    Browse Files
                  </button>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div className="mb-[71px]">
            <label className="text-white text-lg block mb-[17px]">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Collection Name"
              className="w-full bg-[#141414] border border-[#413c3c] rounded-[10px] h-[48px] px-[23px] text-white placeholder:text-[#b9b7b7] focus:outline-none focus:border-[#037ae5] transition-colors"
            />
          </div>

          {/* Description */}
          <div className="mb-[38px]">
            <label className="text-white text-lg block mb-[15px]">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full bg-[#141414] border border-[#413c3c] rounded-[10px] h-[248px] p-[20px] text-white placeholder:text-[#b9b7b7] focus:outline-none focus:border-[#037ae5] transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div className="mb-[93px]">
            <label className="text-white text-lg block mb-[11px]">
              Category
            </label>
            <p className="text-[#9e9999] text-base mb-[26px]">
              Adding a category will make your collection filterable
            </p>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className="bg-[#141414] border border-[#413c3c] rounded-lg px-4 py-2 flex items-center gap-2"
                  >
                    <span className="text-white text-sm">{category}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(index)}
                      className="text-[#b9b7b7] hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddCategory}
              className="bg-[#141414] border border-[#b9b7b7] rounded-[10px] h-[50px] px-[48px] text-[#b9b7b7] text-base hover:border-[#037ae5] hover:text-[#037ae5] transition-colors"
            >
              Add Category
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="border border-[#b9b7b7] rounded-[18px] h-[68px] w-[402px] text-[#b9b7b7] text-[22px] font-medium hover:border-white hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#037ae5] hover:bg-[#0267c7] rounded-[22px] h-[68px] w-[402px] text-white text-[22px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                "Create Collection"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
