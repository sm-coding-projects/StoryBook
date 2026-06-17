"use client";

import { useMemo } from "react";
import { Heart, X, Share2 } from "lucide-react";
import { useGalleryStore, type GalleryPhoto } from "@/stores/gallery-store";
import { GalleryGrid } from "./gallery-grid";

interface FavoritesViewProps {
  photos: GalleryPhoto[];
  onClose: () => void;
  onShare?: () => void;
}

export function FavoritesView({ photos, onClose, onShare }: FavoritesViewProps) {
  const { favorites, clearFavorites } = useGalleryStore();

  const favoritePhotos = useMemo(
    () => photos.filter((p) => favorites.has(p.id)),
    [photos, favorites]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Heart className="w-5 h-5 fill-red-500 text-red-500 shrink-0" />
          <h2 className="text-xl font-medium text-neutral-900 truncate">
            Favorites ({favoritePhotos.length})
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onShare && favoritePhotos.length > 0 && (
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          )}
          {favoritePhotos.length > 0 && (
            <button
              onClick={clearFavorites}
              className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors"
            aria-label="Close favorites"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      </div>

      {favoritePhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
          <Heart className="w-12 h-12 mb-4 stroke-1" />
          <p className="text-lg">No favorites yet</p>
          <p className="text-sm mt-1">
            Click the heart icon on any photo to add it here.
          </p>
        </div>
      ) : (
        <GalleryGrid photos={favoritePhotos} />
      )}
    </div>
  );
}
