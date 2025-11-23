"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  uploadCollectionImage,
  createCollection,
} from "@/actions/collection.actions";
import { Loader } from "@/components/ui/loader";

import UploadIcon from "@/public/upload.svg";

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type CreateCollectionClientProps = {
  user: User;
};

const collectionSchema = z.object({
  name: z.string().min(1, "Please enter a collection name").trim(),
  description: z.string().min(1, "Please enter a description").trim(),
  imageFile: z
    .instanceof(File, { message: "Please upload a collection image" })
    .refine(
      (file) => {
        const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];
        return validTypes.includes(file.type);
      },
      { message: "Only PNG, JPEG, and SVG files are supported" },
    )
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Image size must be less than 5MB",
    }),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export default function CreateCollectionClient({
  user,
}: CreateCollectionClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setValue("imageFile", null as any, { shouldValidate: true });
      setImagePreview(null);
      return;
    }

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

    setValue("imageFile", file, { shouldValidate: true });
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleImageChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] || null;
    handleImageChange(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveImage = () => {
    handleImageChange(null);
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

  const onSubmit = async (data: CollectionFormData) => {
    setIsLoading(true);
    setIsUploading(true);

    try {
      // Upload image to Supabase
      const formData = new FormData();
      formData.append("image", data.imageFile);

      const { url: imageUrl, error: uploadError } =
        await uploadCollectionImage(formData);

      setIsUploading(false);

      if (uploadError || !imageUrl) {
        toast.error(uploadError || "Failed to upload image");
        setIsLoading(false);
        return;
      }

      // Create collection in database
      const { success, error: createError } = await createCollection(
        data.name,
        data.description,
        imageUrl,
        categories,
      );

      if (!success) {
        toast.error(createError || "Failed to create collection");
        setIsLoading(false);
        return;
      }

      toast.success("Collection created successfully!");
      if (user.id) {
        router.push(`/profile/${user.id}`);
      } else {
        router.push("/");
      }
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

  const imageFile = watch("imageFile");

  return (
    <div className="relative min-h-screen w-full bg-background">
      <main className="px-4 sm:px-8 lg:px-[144px] pt-[131px] pb-[100px]">
        {/* Tabs */}
        <div className="flex justify-center items-center mb-12 relative">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Create New Collection
          </h1>

          {/* Tab Indicator Line */}
          <div className="absolute bottom-[-20px] left-0 right-0 h-[1px] bg-border" />
          <div
            className={`absolute bottom-[-23px] h-[3px] bg-foreground transition-all duration-300`}
          />
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-[1154px] mx-auto"
        >
          {/* Collection Image */}
          <div className="mb-8">
            <label className="text-foreground text-sm font-medium block mb-2">
              Collection Image *
            </label>
            <p className="text-muted-foreground text-xs mb-4">
              Only support png, jpeg, svg
            </p>

            <Controller
              name="imageFile"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className={`relative bg-card border border-dashed rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer group hover:border-foreground/50 transition-all ${
                      errors.imageFile ? "border-destructive" : "border-border"
                    }`}
                    onClick={() =>
                      !imagePreview && fileInputRef.current?.click()
                    }
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
                          className="absolute top-3 right-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1.5 transition-all shadow-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={UploadIcon.src}
                          alt="Upload icon"
                          className="w-[70px] h-[81px] mb-4"
                        />
                        <p className="text-muted-foreground text-sm mb-3">
                          Drag & drop your file
                        </p>
                        <p className="text-muted-foreground text-sm mb-3">OR</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="bg-card border border-border rounded-lg px-5 py-2 text-muted-foreground text-sm font-medium hover:border-foreground hover:text-foreground hover:bg-card/80 transition-all"
                        >
                          Browse Files
                        </button>
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
                    accept="image/png,image/jpeg,image/svg+xml"
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

          {/* Name */}
          <div className="mb-6">
            <label className="text-foreground text-sm font-medium block mb-2">
              Name *
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Enter Collection Name"
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

          {/* Description */}
          <div className="mb-6">
            <label className="text-foreground text-sm font-medium block mb-2">
              Description *
            </label>
            <textarea
              {...register("description")}
              placeholder="Description"
              className={`w-full bg-background border rounded-lg h-32 p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all resize-none ${
                errors.description ? "border-destructive" : "border-border"
              }`}
            />
            {errors.description && (
              <p className="text-destructive text-xs mt-2">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="mb-8">
            <label className="text-foreground text-sm font-medium block mb-2">
              Category
            </label>
            <p className="text-muted-foreground text-xs mb-4">
              Adding a category will make your collection filterable
            </p>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className="bg-card border border-border rounded-md px-3 py-1.5 flex items-center gap-2"
                  >
                    <span className="text-foreground text-sm">{category}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddCategory}
              className="bg-card border border-border rounded-lg h-10 px-6 text-muted-foreground text-sm font-medium hover:border-foreground hover:text-foreground hover:bg-card/80 transition-all"
            >
              Add Category
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 border border-border rounded-lg h-11 text-muted-foreground text-sm font-medium hover:border-foreground hover:text-foreground hover:bg-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-lg h-11 text-primary-foreground text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader size="sm" />
                  <span>{isUploading ? "Uploading..." : "Creating..."}</span>
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
