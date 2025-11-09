"use client";

import React, { useState, useRef } from "react";
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
import { Camera, Loader2, User } from "lucide-react";
import { updateProfile } from "@/actions/user.actions";
import { toast } from "sonner";
import type { UserProfile } from "@/actions/user.actions";

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
};

export default function EditProfileDialog({
  open,
  onOpenChange,
  user,
}: EditProfileDialogProps) {
  const [displayName, setDisplayName] = useState(user.name || "");
  const [imagePreview, setImagePreview] = useState<string | null>(
    user.image || null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageFormData: FormData | undefined;

      if (selectedFile) {
        imageFormData = new FormData();
        imageFormData.append("file", selectedFile);
      }

      const result = await updateProfile(displayName, imageFormData);

      if (result.success) {
        toast.success("Profile updated successfully!");
        onOpenChange(false);
        // Reset state
        setSelectedFile(null);
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
    setDisplayName(user.name || "");
    setImagePreview(user.image || null);
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#141414] border-[#413c3c] text-white sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#413c3c]">
          <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
          <DialogDescription className="text-[#9e9999]">
            Update your profile picture and display name
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="relative group">
              {/* Image Preview */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-[#1f1f1f] border-2 border-[#413c3c] transition-all duration-300 group-hover:border-[#037ae5] group-hover:shadow-lg group-hover:shadow-blue-500/20">
                {imagePreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-[#413c3c]" />
                  </div>
                )}
              </div>

              {/* Camera Button Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 w-32 h-32 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60"
              >
                <Camera className="w-8 h-8 text-white" />
              </button>

              {/* Badge for new image */}
              {selectedFile && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full animate-in zoom-in duration-300">
                  New
                </div>
              )}
            </div>

            {/* Upload Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-[#413c3c] bg-transparent hover:bg-[#1f1f1f] hover:text-white hover:border-[#037ae5] text-white transition-all duration-300"
            >
              <Camera className="w-4 h-4 mr-2" />
              {selectedFile ? "Change Photo" : "Upload Photo"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageSelect}
              className="hidden"
            />

            <p className="text-xs text-[#9e9999] text-center">
              Recommended: Square image, at least 200x200px
              <br />
              Max size: 5MB (JPEG, PNG, WebP, GIF)
            </p>
          </div>

          {/* Display Name Section */}
          <div className="space-y-3">
            <Label htmlFor="displayName" className="text-white font-medium">
              Display Name
            </Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={50}
              className="bg-[#1f1f1f] border-[#413c3c] text-white placeholder:text-[#5f5f5f] focus:border-[#037ae5] focus:ring-[#037ae5] transition-all duration-300"
            />
            <p className="text-xs text-[#9e9999]">
              {displayName.length}/50 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 border-[#413c3c] bg-transparent hover:bg-[#1f1f1f] hover:text-white text-white transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || (!selectedFile && displayName === user.name)
              }
              className="flex-1 bg-[#037ae5] hover:bg-[#0366c7] text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
