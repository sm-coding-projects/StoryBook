'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Heart, Download } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { type Photo } from './GalleryGrid';

interface LightboxProps {
  photo: Photo | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  /** Optional panel rendered under the image (e.g. proofing controls). */
  footer?: React.ReactNode;
}

export const Lightbox: React.FC<LightboxProps> = ({
  photo,
  onClose,
  onPrev,
  onNext,
  isFavorite,
  onToggleFavorite,
  footer
}) => {
  if (!photo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center select-none"
        onClick={onClose}
      >
        {/* Controls */}
        <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex justify-between items-center z-10">
          <div className="flex space-x-2 sm:space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(photo.id);
              }}
              className={`p-2 transition-colors ${
                isFavorite ? 'text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <Download size={24} />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Navigation */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-1 sm:left-4 p-2 sm:p-4 text-white/30 hover:text-white transition-colors z-10"
        >
          <ChevronLeft className="w-8 h-8 sm:w-12 sm:h-12" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-1 sm:right-4 p-2 sm:p-4 text-white/30 hover:text-white transition-colors z-10"
        >
          <ChevronRight className="w-8 h-8 sm:w-12 sm:h-12" />
        </button>

        {/* Image Container */}
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-[90vw] max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <ImageWithFallback
            src={photo.url}
            alt={photo.alt}
            className="w-full h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          />
          <div className="absolute -bottom-10 left-0 right-0 text-white/40 text-[10px] font-black tracking-[0.3em] uppercase truncate">
            {photo.alt}
          </div>
        </motion.div>

        {footer && (
          <div
            className="absolute bottom-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-md border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {footer}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
