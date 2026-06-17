"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useGalleryStore } from "@/stores/gallery-store";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  photoId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onToggle?: (photoId: string, isFavorite: boolean) => void;
}

export function FavoriteButton({
  photoId,
  size = "md",
  className,
  onToggle,
}: FavoriteButtonProps) {
  const { favorites, toggleFavorite } = useGalleryStore();
  const isFavorite = favorites.has(photoId);
  const [animating, setAnimating] = useState(false);

  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(photoId);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    onToggle?.(photoId, !isFavorite);
  };

  return (
    <button
      onClick={handleClick}
      className={cn("relative transition-transform", className)}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          "transition-all duration-200",
          isFavorite ? "fill-red-500 text-red-500" : "text-current",
          animating && "scale-125"
        )}
      />
      {/* Burst animation */}
      {animating && isFavorite && (
        <span className="absolute inset-0 animate-ping">
          <Heart
            className={cn(
              sizeClasses[size],
              "fill-red-500 text-red-500 opacity-50"
            )}
          />
        </span>
      )}
    </button>
  );
}
