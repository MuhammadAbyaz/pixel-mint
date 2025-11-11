"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Edit2, Plus } from "lucide-react";
import type { UserProfile } from "@/actions/user.actions";
import EditProfileDialog from "./EditProfileDialog";

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
};

export default function ProfileClient({
  user,
  isOwner,
  collections,
  favorites,
}: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"collections" | "favorites">(
    "collections",
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const displayedItems = activeTab === "collections" ? collections : favorites;

  return (
    <div className="relative min-h-screen w-full bg-black">
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
                  className="absolute bottom-2 right-2 bg-[#037ae5] hover:bg-[#0366c7] text-white p-2.5 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-blue-500/50"
                >
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h1 className="text-white text-[20px] sm:text-[24px] font-semibold">
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
            <p className="text-[#9e9999] text-[13px] sm:text-[14px] mb-1 transition-colors hover:text-white/70">
              Popularity: 1 Million
            </p>
            <p className="text-[#9e9999] text-[13px] sm:text-[14px] transition-colors hover:text-white/70">
              Joined August 2001
            </p>
          </div>
        </div>

        {/* Tabs - Hide Favorites tab if not owner */}
        <div className="flex justify-center mb-[48px] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="relative inline-flex gap-8 sm:gap-16">
            <button
              onClick={() => setActiveTab("collections")}
              className={`text-[16px] sm:text-[18px] font-bold pb-2 transition-all duration-300 relative ${
                activeTab === "collections"
                  ? "text-white"
                  : "text-white/50 hover:text-white/75"
              }`}
            >
              Collections
              {activeTab === "collections" && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-full animate-in slide-in-from-left duration-300" />
              )}
            </button>
            {/* Only show Favorites tab for owner */}
            {isOwner && (
              <button
                onClick={() => setActiveTab("favorites")}
                className={`text-[16px] sm:text-[18px] font-normal pb-2 transition-all duration-300 relative ${
                  activeTab === "favorites"
                    ? "text-white"
                    : "text-white/50 hover:text-white/75"
                }`}
              >
                Favorites
                {activeTab === "favorites" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-full animate-in slide-in-from-left duration-300" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Collections/Favorites Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 max-w-[1280px] mx-auto">
          {displayedItems.map((item, index) => (
            <Link
              href={`/collection/${item.slug}`}
              key={`${item.slug}-${index}`}
              className="border border-[#413c3c] rounded-[20px] overflow-hidden bg-[#141414] transition-all duration-500 hover:scale-105 hover:border-white/50 hover:shadow-xl hover:shadow-white/10 cursor-pointer group animate-in fade-in zoom-in-95 duration-500"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-4">
                <p className="text-white text-[13px] sm:text-[14px] font-semibold transition-colors duration-300 group-hover:text-blue-400">
                  {item.name}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {displayedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <p className="text-white/50 text-lg mb-2">
                {activeTab === "favorites"
                  ? "No favorites yet"
                  : "No collections yet"}
              </p>
              <p className="text-white/30 text-sm">
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

      {/* Floating Action Button - Create Collection */}
      {isOwner && (
        <Link
          href="/create-collection"
          className="fixed bottom-8 right-8 bg-[#037ae5] hover:bg-[#0267c7] text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl z-50 group"
        >
          <Plus className="w-6 h-6" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Create Collection
          </span>
        </Link>
      )}
    </div>
  );
}
