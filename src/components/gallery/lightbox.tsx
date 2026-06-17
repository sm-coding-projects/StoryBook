"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Download,
  Share2,
} from "lucide-react";
import { useGalleryStore } from "@/stores/gallery-store";
import { cn } from "@/lib/utils";

interface LightboxProps {
  onDownload?: (photoId: string) => void;
  onShare?: (photoId: string) => void;
}

export function Lightbox({ onDownload, onShare }: LightboxProps) {
  const {
    photos,
    currentPhotoIndex,
    lightboxOpen,
    favorites,
    closeLightbox,
    nextPhoto,
    prevPhoto,
    toggleFavorite,
  } = useGalleryStore();

  const [imageLoaded, setImageLoaded] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const currentPhoto = photos[currentPhotoIndex];
  const isFavorite = currentPhoto ? favorites.has(currentPhoto.id) : false;

  // Reset loaded state on photo change
  useEffect(() => {
    setImageLoaded(false);
  }, [currentPhotoIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      switch (e.key) {
        case "ArrowLeft":
          prevPhoto();
          break;
        case "ArrowRight":
          nextPhoto();
          break;
        case "Escape":
          closeLightbox();
          break;
      }
    },
    [lightboxOpen, prevPhoto, nextPhoto, closeLightbox]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextPhoto();
      else prevPhoto();
    }
  };

  if (!lightboxOpen || !currentPhoto) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white/80">
        <span className="text-sm font-medium">
          {currentPhotoIndex + 1} / {photos.length}
        </span>
        <button
          onClick={closeLightbox}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close lightbox"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image area */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-4">
        {/* Previous button */}
        {photos.length > 1 && (
          <button
            onClick={prevPhoto}
            className="absolute left-4 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-all hidden sm:block"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Image */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <img
            key={currentPhoto.id}
            src={currentPhoto.url}
            alt={currentPhoto.filename}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "max-w-full max-h-[calc(100vh-140px)] object-contain transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            draggable={false}
          />
        </div>

        {/* Next button */}
        {photos.length > 1 && (
          <button
            onClick={nextPhoto}
            className="absolute right-4 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-all hidden sm:block"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 text-white/80">
        <span className="text-sm truncate min-w-0 flex-1 sm:flex-initial sm:max-w-[200px]">
          {currentPhoto.filename}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => toggleFavorite(currentPhoto.id)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart
              className={cn(
                "w-5 h-5",
                isFavorite ? "fill-red-500 text-red-500" : ""
              )}
            />
          </button>
          {onDownload && (
            <button
              onClick={() => onDownload(currentPhoto.id)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Download"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
          {onShare && (
            <button
              onClick={() => onShare(currentPhoto.id)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
