import * as React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loader({ size = "md", className }: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-6 h-6 border-2",
  };

  return (
    <div
      className={cn(
        "border-primary-foreground border-t-transparent rounded-full animate-spin",
        sizeClasses[size],
        className
      )}
    />
  );
}

