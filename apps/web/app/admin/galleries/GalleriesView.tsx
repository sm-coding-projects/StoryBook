'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CreateGalleryModal } from '@/components/CreateGalleryModal';
import { createGallery } from '@/actions/gallery';

interface GalleryItem {
  id: string;
  title: string;
  status: string;
  coverImage: string | null;
  photoCount: number;
  favoriteCount: number;
  created_at: string;
  photos?: { thumb_key: string | null; web_key: string | null }[];
}

interface GalleriesViewProps {
  galleries: GalleryItem[];
}

export function GalleriesView({ galleries }: GalleriesViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async (settings: {
    title: string;
    privacy: string;
    allowDownloads: boolean;
    watermarked: boolean;
    proofingEnabled: boolean;
  }) => {
    try {
      const gallery = await createGallery(settings);
      setIsCreating(false);
      router.push(`/admin/editor/${gallery.id}`);
    } catch (err) {
      console.error('Failed to create gallery:', err);
    }
  };


  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex justify-between items-end mb-16 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 uppercase">Collections</h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] mt-2">Manage your visual archives</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-black text-white px-8 py-4 rounded-none flex items-center gap-2 hover:bg-black/90 transition-colors shadow-sm text-xs font-bold uppercase tracking-widest"
        >
          <Plus size={18} /> New Collection
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {galleries.map(gallery => (
          <motion.div
            layoutId={gallery.id}
            key={gallery.id}
            className="group cursor-pointer"
            onClick={() => router.push(`/admin/editor/${gallery.id}`)}
          >
            <div className="aspect-[4/5] relative overflow-hidden bg-gray-100 mb-6">
              {gallery.coverImage ? (
                <img
                  src={gallery.coverImage}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                  alt=""
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">No photos yet</span>
                </div>
              )}
              <div className="absolute top-4 right-4 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-gray-900 shadow-sm">
                {gallery.status}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-2">{gallery.title}</h3>
              <div className="flex items-center gap-6 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                <span className="flex items-center gap-2">{gallery.photoCount} Assets</span>
                <span className="flex items-center gap-2">{gallery.favoriteCount} Proofs</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {galleries.length === 0 && (
        <div className="text-center py-32">
          <p className="text-[#999] font-black text-[10px] tracking-[0.3em] uppercase mb-6">
            No collections yet
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-black text-white px-8 py-4 rounded-none flex items-center gap-2 hover:bg-black/90 transition-colors text-xs font-bold uppercase tracking-widest mx-auto"
          >
            <Plus size={18} /> Create Your First Collection
          </button>
        </div>
      )}

      <AnimatePresence>
        {isCreating && (
          <CreateGalleryModal
            onClose={() => setIsCreating(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
