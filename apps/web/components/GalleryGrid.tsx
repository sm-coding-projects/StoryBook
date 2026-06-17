'use client';

import React from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Heart, Maximize2 } from 'lucide-react';

export interface Photo {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

interface GalleryGridProps {
  photos: Photo[];
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  onPhotoClick: (photo: Photo) => void;
  title?: string;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  photos,
  favorites,
  toggleFavorite,
  onPhotoClick,
  title
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {title && (
        <h2 className="text-2xl font-light tracking-widest uppercase text-center mb-8 sm:mb-16 text-gray-800 border-b border-gray-100 pb-6 sm:pb-8">
          {title}
        </h2>
      )}

      <ResponsiveMasonry
        columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}
      >
        <Masonry gutter="24px">
          {photos.map((photo) => (
            <motion.div
              layout
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative group cursor-zoom-in"
            >
              <div
                className="relative overflow-hidden bg-gray-100"
                onClick={() => onPhotoClick(photo)}
              >
                <ImageWithFallback
                  src={photo.url}
                  alt={photo.alt}
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(photo.id);
                    }}
                    className={`p-3 rounded-none backdrop-blur-md transition-all duration-300 ${
                      favorites.has(photo.id)
                        ? 'bg-black text-white'
                        : 'bg-white/20 text-white hover:bg-white/40'
                    }`}
                  >
                    <Heart size={20} fill={favorites.has(photo.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    className="p-3 rounded-none bg-white/20 text-white hover:bg-white/40 backdrop-blur-md transition-all duration-300"
                  >
                    <Maximize2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </Masonry>
      </ResponsiveMasonry>

      {photos.length === 0 && (
        <div className="text-center py-32">
          <p className="text-[#999] font-black text-[10px] tracking-[0.3em] uppercase">
            No assets found in this collection.
          </p>
        </div>
      )}
    </div>
  );
};
