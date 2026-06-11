'use client';

import React from 'react';
import { Heart, Download, Grid } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'gallery' | 'favorites';
  setView: (view: 'home' | 'gallery' | 'favorites') => void;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView, favoritesCount }) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-[#E5E5E5]">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => setView('home' as 'home' | 'gallery' | 'favorites')}
          >
            <span className="text-sm font-black tracking-[-0.04em] uppercase text-black group-hover:opacity-60 transition-opacity">
              StoryBook
            </span>
            <div className="h-4 w-[1px] bg-[#E5E5E5] mx-4" />
            <span className="text-[10px] tracking-[0.2em] text-[#999] uppercase font-bold">
              Gallery Access
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-8">
            <button
              onClick={() => setView('gallery')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                currentView === 'gallery' ? 'text-black' : 'text-[#999] hover:text-black'
              }`}
            >
              <Grid size={14} />
              <span className="hidden md:block">Gallery</span>
            </button>

            <button
              onClick={() => setView('favorites')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 relative ${
                currentView === 'favorites' ? 'text-black' : 'text-[#999] hover:text-black'
              }`}
            >
              <Heart size={14} fill={currentView === 'favorites' ? 'currentColor' : 'none'} />
              <span className="hidden md:block">Favorites</span>
              {favoritesCount > 0 && (
                <span className="ml-1 text-[9px] font-black bg-black text-white px-1.5 py-0.5 min-w-[1.2rem] text-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            <div className="h-4 w-[1px] bg-[#E5E5E5] mx-2 hidden sm:block" />

            <button className="text-[#999] hover:text-black transition-colors" title="Download All">
              <Download size={16} />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
