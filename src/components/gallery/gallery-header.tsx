"use client";

import { Grid3X3, LayoutGrid, Heart, Play } from "lucide-react";
import { useGalleryStore, type ViewMode } from "@/stores/gallery-store";
import { cn } from "@/lib/utils";

interface GalleryHeaderProps {
  galleryName: string;
  photographerName?: string;
  photoCount: number;
  favoriteCount: number;
  onShowFavorites?: () => void;
  showFavorites?: boolean;
}

export function GalleryHeader({
  galleryName,
  photographerName,
  photoCount,
  favoriteCount,
  onShowFavorites,
  showFavorites,
}: GalleryHeaderProps) {
  const { viewMode, setViewMode, startSlideshow } = useGalleryStore();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-neutral-900">
          {galleryName}
        </h1>
        {photographerName && (
          <p className="text-sm text-neutral-500 mt-1">
            by {photographerName}
          </p>
        )}
        <p className="text-sm text-neutral-400 mt-1">{photoCount} photos</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("masonry")}
            className={cn(
              "p-2 rounded transition-colors",
              viewMode === "masonry"
                ? "bg-neutral-900 text-white"
                : "text-neutral-400 hover:text-neutral-600"
            )}
            aria-label="Masonry view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded transition-colors",
              viewMode === "grid"
                ? "bg-neutral-900 text-white"
                : "text-neutral-400 hover:text-neutral-600"
            )}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {favoriteCount > 0 && (
            <button
              onClick={onShowFavorites}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors",
                showFavorites
                  ? "bg-red-50 text-red-600"
                  : "text-neutral-500 hover:bg-neutral-100"
              )}
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5",
                  showFavorites && "fill-red-500"
                )}
              />
              {favoriteCount}
            </button>
          )}
          <button
            onClick={startSlideshow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Slideshow
          </button>
        </div>
      </div>
    </div>
  );
}
