'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ChevronDown } from 'lucide-react';

interface CoverProps {
  onEnter: () => void;
  title: string;
  date: string;
  coverImage: string;
}

export const Cover: React.FC<CoverProps> = ({ onEnter, title, date, coverImage }) => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.8 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <ImageWithFallback
          src={coverImage}
          alt="Wedding Cover"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-full max-w-3xl"
        >
          <span className="text-white/80 uppercase tracking-[0.4em] text-xs sm:text-sm mb-4 block font-light">
            Our Wedding Day
          </span>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl text-white font-light tracking-tight mb-6 break-words">
            {title}
          </h1>
          <p className="text-white/70 text-lg sm:text-xl font-light tracking-widest mb-12">
            {date}
          </p>

          <button
            onClick={onEnter}
            className="px-10 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white tracking-widest uppercase text-xs transition-all duration-300 hover:px-12"
          >
            View Gallery
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50"
      >
        <ChevronDown className="animate-bounce" size={32} />
      </motion.div>
    </div>
  );
};
