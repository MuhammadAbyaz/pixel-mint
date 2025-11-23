"use client";

import { Plus, Image, FolderPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function FloatingCreateButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="fixed bottom-8 right-8 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible hover area to keep menu open */}
      <div
        className={`absolute bottom-0 right-0 w-20 transition-all duration-500 ${
          isHovered ? "h-44 opacity-0" : "h-0 opacity-0"
        }`}
      />

      {/* Create Collection Button */}
      <Link
        href="/create-collection"
        className={`absolute bottom-28 right-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-3 shadow-lg transition-all duration-500 group/collection z-20 ${
          isHovered
            ? "opacity-100 scale-100"
            : "opacity-0 scale-0 pointer-events-none"
        }`}
      >
        <FolderPlus className="w-4 h-4" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card border border-border text-foreground px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap opacity-0 group-hover/collection:opacity-100 transition-opacity shadow-sm">
          Create Collection
        </span>
      </Link>

      {/* Create NFT Button */}
      <Link
        href="/create-nft"
        className={`absolute bottom-14 right-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-3 shadow-lg transition-all duration-500 group/nft z-10 ${
          isHovered
            ? "opacity-100 scale-100"
            : "opacity-0 scale-0 pointer-events-none"
        }`}
      >
        <Image className="w-4 h-4" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card border border-border text-foreground px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap opacity-0 group-hover/nft:opacity-100 transition-opacity shadow-sm">
          Create NFT
        </span>
      </Link>

      {/* Main Button */}
      <button
        className={`relative bg-primary text-primary-foreground rounded-full p-3.5 shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-105 z-30 ${
          isHovered ? "rotate-45" : "rotate-0"
        }`}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
