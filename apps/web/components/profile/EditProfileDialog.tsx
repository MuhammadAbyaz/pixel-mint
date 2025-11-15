"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, User } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { updateProfile } from "@/actions/user.actions";
import { toast } from "sonner";
import type { UserProfile } from "@/actions/user.actions";

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
};

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50, "Display name must be 50 characters or less").trim(),
  imageFile: z.instanceof(File).optional().refine(
    (file) => {
      if (!file) return true;
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      return validTypes.includes(file.type);
    },
    { message: "Please upload a valid image file (JPEG, PNG, WebP, or GIF)" }
  ).refine(
    (file) => {
      if (!file) return true;
      return file.size <= 5 * 1024 * 1024;
    },
    { message: "File size must be less than 5MB" }
  ),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfileDialog({
  open,
  onOpenChange,
  user,
}: EditProfileDialogProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    user.image || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.name || "",
      imageFile: undefined,
    },
  });

  const displayName = watch("displayName");
  const imageFile = watch("imageFile");

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open) {
      reset({
        displayName: user.name || "",
        imageFile: undefined,
      });
      setImagePreview(user.image || null);
    }
  }, [open, user, reset]);

  const handleImageSelect = (file: File | null) => {
    if (!file) {
      setValue("imageFile", undefined, { shouldValidate: true });
      setImagePreview(user.image || null);
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
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
    handleImageSelect(file);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);

    try {
      let imageFormData: FormData | undefined;

      if (data.imageFile) {
        imageFormData = new FormData();
        imageFormData.append("file", data.imageFile);
      }

      const result = await updateProfile(data.displayName, imageFormData);

      if (result.success) {
        toast.success("Profile updated successfully!");
        onOpenChange(false);
        // Reset state
        setValue("imageFile", undefined);
        window.location.reload(); // Reload to show updated data
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset({
      displayName: user.name || "",
      imageFile: undefined,
    });
    setImagePreview(user.image || null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl sm:text-2xl font-semibold">Edit Profile</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update your profile picture and display name
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="relative group">
              {/* Image Preview */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-card border-2 border-border transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20">
                {imagePreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Camera Button Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 w-32 h-32 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background/60"
              >
                <Camera className="w-8 h-8 text-foreground" />
              </button>

              {/* Badge for new image */}
              {imageFile && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full animate-in zoom-in duration-300">
                  New
                </div>
              )}
            </div>

            {/* Upload Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-border bg-transparent hover:bg-card hover:text-foreground hover:border-primary text-foreground transition-all duration-300"
            >
              <Camera className="w-4 h-4 mr-2" />
              {imageFile ? "Change Photo" : "Upload Photo"}
            </Button>

            <Controller
              name="imageFile"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <>
                  <input
                    {...field}
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleImageSelect(file);
                    }}
                    className="hidden"
                  />
                  {errors.imageFile && (
                    <p className="text-destructive text-xs text-center">
                      {errors.imageFile.message}
                    </p>
                  )}
                </>
              )}
            />

            <p className="text-xs text-muted-foreground text-center">
              Recommended: Square image, at least 200x200px
              <br />
              Max size: 5MB (JPEG, PNG, WebP, GIF)
            </p>
          </div>

          {/* Display Name Section */}
          <div className="space-y-3">
            <Label htmlFor="displayName" className="text-foreground font-medium">
              Display Name
            </Label>
            <Input
              id="displayName"
              type="text"
              {...register("displayName")}
              placeholder="Enter your display name"
              maxLength={50}
              className={`bg-background border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary transition-all duration-300 ${
                errors.displayName ? "border-destructive" : "border-border"
              }`}
            />
            {errors.displayName && (
              <p className="text-destructive text-xs">
                {errors.displayName.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {displayName?.length || 0}/50 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 border-border bg-transparent hover:bg-card hover:text-foreground text-foreground transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || (!imageFile && displayName === user.name)
              }
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
