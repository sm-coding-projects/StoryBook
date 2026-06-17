"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { Heart, Download, Maximize2 } from "lucide-react";
import { useGalleryStore, type GalleryPhoto } from "@/stores/gallery-store";
import { cn } from "@/lib/utils";

interface GalleryGridProps {
  photos: GalleryPhoto[];
  onFavoriteToggle?: (photoId: string) => void;
  onDownload?: (photo: GalleryPhoto) => void;
}

function PhotoCard({
  photo,
  index,
  onFavoriteToggle,
  onDownload,
}: {
  photo: GalleryPhoto;
  index: number;
  onFavoriteToggle?: (photoId: string) => void;
  onDownload?: (photo: GalleryPhoto) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const { favorites, toggleFavorite, openLightbox } = useGalleryStore();
  const isFavorite = favorites.has(photo.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(photo.id);
    onFavoriteToggle?.(photo.id);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(photo);
  };

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-sm"
      onClick={() => openLightbox(index)}
    >
      {/* Blur placeholder */}
      <div
        className={cn(
          "absolute inset-0 bg-neutral-200 animate-pulse transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100"
        )}
      />

      {/* Image */}
      <img
        src={photo.thumbnailUrl}
        alt={photo.filename}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full block transition-all duration-500",
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]",
          "group-hover:scale-[1.03] transition-transform duration-300"
        )}
        style={{
          aspectRatio:
            photo.width && photo.height
              ? `${photo.width}/${photo.height}`
              : undefined,
        }}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end justify-between p-3 opacity-0 group-hover:opacity-100">
        <button
          onClick={handleFavorite}
          className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors",
              isFavorite
                ? "fill-red-500 text-red-500"
                : "text-neutral-700"
            )}
          />
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
            aria-label="Download photo"
          >
            <Download className="w-4 h-4 text-neutral-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(index);
            }}
            className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
            aria-label="View full size"
          >
            <Maximize2 className="w-4 h-4 text-neutral-700" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function GalleryGrid({
  photos,
  onFavoriteToggle,
  onDownload,
}: GalleryGridProps) {
  const { setPhotos } = useGalleryStore();
  const [visibleCount, setVisibleCount] = useState(30);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPhotos(photos);
  }, [photos, setPhotos]);

  // Infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && visibleCount < photos.length) {
        setVisibleCount((prev) => Math.min(prev + 20, photos.length));
      }
    },
    [visibleCount, photos.length]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "200px",
    });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const visiblePhotos = photos.slice(0, visibleCount);

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-neutral-400">
        <p className="text-lg">No photos in this gallery yet.</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveMasonry
        columnsCountBreakPoints={{ 350: 2, 750: 3, 1100: 4 }}
      >
        <Masonry gutter="8px">
          {visiblePhotos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              onFavoriteToggle={onFavoriteToggle}
              onDownload={onDownload}
            />
          ))}
        </Masonry>
      </ResponsiveMasonry>

      {visibleCount < photos.length && (
        <div ref={loaderRef} className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
