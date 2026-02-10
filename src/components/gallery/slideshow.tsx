"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { X, Pause, Play } from "lucide-react";
import { useGalleryStore } from "@/stores/gallery-store";
import { cn } from "@/lib/utils";

export function Slideshow() {
  const {
    photos,
    currentPhotoIndex,
    slideshowActive,
    slideshowInterval,
    nextPhoto,
    stopSlideshow,
    closeLightbox,
  } = useGalleryStore();

  const [paused, setPaused] = useState(false);
  const [kenBurnsKey, setKenBurnsKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const currentPhoto = photos[currentPhotoIndex];
  const prevIndexRef = useRef(currentPhotoIndex);

  // Auto-advance
  useEffect(() => {
    if (!slideshowActive || paused) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      nextPhoto();
    }, slideshowInterval);
    return () => clearInterval(timerRef.current);
  }, [slideshowActive, paused, slideshowInterval, nextPhoto]);

  // Ken Burns variation on photo change
  useEffect(() => {
    if (currentPhotoIndex !== prevIndexRef.current) {
      setKenBurnsKey((k) => k + 1);
      prevIndexRef.current = currentPhotoIndex;
    }
  }, [currentPhotoIndex]);

  const handleExit = useCallback(() => {
    stopSlideshow();
    closeLightbox();
  }, [stopSlideshow, closeLightbox]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleExit();
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    if (slideshowActive) {
      window.addEventListener("keydown", handleKey);
    }
    return () => window.removeEventListener("keydown", handleKey);
  }, [slideshowActive, handleExit]);

  // Lock body scroll
  useEffect(() => {
    if (slideshowActive) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [slideshowActive]);

  if (!slideshowActive || !currentPhoto) return null;

  // Alternate Ken Burns directions
  const direction = kenBurnsKey % 2 === 0;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Crossfade image with Ken Burns */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          key={`${currentPhoto.id}-${kenBurnsKey}`}
          src={currentPhoto.url}
          alt={currentPhoto.filename}
          className={cn(
            "absolute inset-0 w-full h-full object-contain",
            "animate-[kenburns_8s_ease-in-out_forwards]"
          )}
          style={{
            animationName: direction ? "kenburnsA" : "kenburnsB",
          }}
          draggable={false}
        />
      </div>

      {/* Controls overlay — show on hover/pause */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-between transition-opacity duration-300",
          paused ? "opacity-100" : "opacity-0 hover:opacity-100"
        )}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
          <span className="text-white/80 text-sm font-medium">
            {currentPhotoIndex + 1} / {photos.length}
          </span>
          <button
            onClick={handleExit}
            className="p-2 rounded-full text-white/80 hover:bg-white/10 transition-colors"
            aria-label="Exit slideshow"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center play/pause */}
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPaused((p) => !p);
            }}
            className="p-4 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label={paused ? "Resume slideshow" : "Pause slideshow"}
          >
            {paused ? (
              <Play className="w-8 h-8" />
            ) : (
              <Pause className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Bottom bar */}
        <div className="px-6 py-4 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white/70 text-sm text-center">
            {currentPhoto.filename}
          </p>
        </div>
      </div>

      {/* Ken Burns keyframes */}
      <style jsx global>{`
        @keyframes kenburnsA {
          0% {
            transform: scale(1) translate(0, 0);
          }
          100% {
            transform: scale(1.08) translate(-1%, -1%);
          }
        }
        @keyframes kenburnsB {
          0% {
            transform: scale(1.08) translate(-1%, -1%);
          }
          100% {
            transform: scale(1) translate(0, 0);
          }
        }
      `}</style>
    </div>
  );
}
