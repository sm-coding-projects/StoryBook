'use client';

import React, { useState, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, Star, Send } from 'lucide-react';
import { GalleryGrid, type Photo } from '@/components/GalleryGrid';
import { Lightbox } from '@/components/Lightbox';
import { LogoutButton } from '@/components/LogoutButton';
import { toggleFavorite, submitSelection, setRating, addComment } from '@/actions/proofing';

interface ClientGalleryViewProps {
  gallery: {
    id: string;
    title: string;
    owner_id: string;
  };
  photos: {
    id: string;
    original_key: string;
    web_key: string | null;
    metadata: Record<string, unknown> | null;
    status: string;
  }[];
  favoriteIds: string[];
  ratings: { photo_id: string; rating: number }[];
  comments: { id: string; photo_id: string; body: string; created_at: string }[];
  isSubmitted: boolean;
  isOwner: boolean;
  userRole: string;
}

export function ClientGalleryView({
  gallery,
  photos,
  favoriteIds,
  ratings,
  comments,
  isSubmitted,
  isOwner,
  userRole,
}: ClientGalleryViewProps) {
  const router = useRouter();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localRatings, setLocalRatings] = useState<Record<string, number>>(
    () => Object.fromEntries(ratings.map(r => [r.photo_id, r.rating]))
  );
  const [localComments, setLocalComments] = useState(comments);
  const [commentDraft, setCommentDraft] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  const handleRate = (photoId: string, rating: number) => {
    if (isSubmitted) return;
    setLocalRatings(prev => ({ ...prev, [photoId]: rating }));
    startTransition(async () => {
      try {
        await setRating(gallery.id, photoId, rating);
      } catch (err) {
        console.error('Rating failed:', err);
      }
    });
  };

  const handleComment = async (photoId: string) => {
    const body = commentDraft.trim();
    if (!body || isSubmitted) return;
    setSavingComment(true);
    try {
      await addComment(gallery.id, photoId, body);
      setLocalComments(prev => [
        ...prev,
        { id: `local-${prev.length}`, photo_id: photoId, body, created_at: new Date().toISOString() },
      ]);
      setCommentDraft('');
    } catch (err) {
      console.error('Comment failed:', err);
    }
    setSavingComment(false);
  };

  const [optimisticFavorites, addOptimisticFavorite] = useOptimistic(
    new Set(favoriteIds),
    (state: Set<string>, photoId: string) => {
      const next = new Set(state);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    }
  );

  const uiPhotos: Photo[] = photos
    .filter(p => p.status === 'ready' && p.web_key)
    .map(p => ({
      id: p.id,
      url: `/api/signed-urls?key=${encodeURIComponent(p.web_key as string)}`,
      alt: p.original_key.split('/').pop() || 'Photo',
      width: (p.metadata?.width as number) || 1080,
      height: (p.metadata?.height as number) || 720,
    }));

  const handleToggleFavorite = (photoId: string) => {
    if (isSubmitted) return;
    startTransition(async () => {
      addOptimisticFavorite(photoId);
      await toggleFavorite(gallery.id, photoId);
    });
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;
    const confirmed = confirm('Are you sure? This will lock your selection.');
    if (!confirmed) return;

    try {
      await submitSelection(gallery.id);
      router.refresh();
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <span className="text-sm font-black tracking-[-0.04em] uppercase text-black">
                StoryBook
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#999]">
                {isSubmitted ? 'Selection Submitted' : 'Verified Client Access'}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="pt-8">
        <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
          <h1 className="text-4xl font-light tracking-tight mb-2 uppercase">{gallery.title}</h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase">
            {isSubmitted ? 'Your selection has been submitted' : 'Select your favorites to finalize your set'}
          </p>
        </div>

        <GalleryGrid
          photos={uiPhotos}
          favorites={optimisticFavorites}
          toggleFavorite={handleToggleFavorite}
          onPhotoClick={setSelectedPhoto}
        />

        {!isSubmitted && (
          <div className="fixed bottom-8 right-8 z-50">
            <button
              onClick={handleSubmit}
              className="bg-black text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform uppercase text-xs font-bold tracking-widest"
            >
              <ShieldCheck size={20} />
              Submit Final Selection ({optimisticFavorites.size})
            </button>
          </div>
        )}
      </main>

      {(isOwner || userRole === 'photographer') && (
        <button
          onClick={() => router.push('/admin/galleries')}
          className="fixed bottom-8 left-8 p-3 bg-gray-100 text-gray-500 rounded-full hover:bg-black hover:text-white transition-all shadow-lg"
          title="Back to Admin"
        >
          <LogOut size={20} />
        </button>
      )}

      <Lightbox
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onNext={() => {
          if (!selectedPhoto) return;
          const idx = uiPhotos.findIndex(p => p.id === selectedPhoto.id);
          if (idx < uiPhotos.length - 1) setSelectedPhoto(uiPhotos[idx + 1]);
        }}
        onPrev={() => {
          if (!selectedPhoto) return;
          const idx = uiPhotos.findIndex(p => p.id === selectedPhoto.id);
          if (idx > 0) setSelectedPhoto(uiPhotos[idx - 1]);
        }}
        isFavorite={selectedPhoto ? optimisticFavorites.has(selectedPhoto.id) : false}
        onToggleFavorite={handleToggleFavorite}
        footer={selectedPhoto && (
          <div className="max-w-3xl mx-auto px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(selectedPhoto.id, star)}
                    disabled={isSubmitted}
                    className="p-1 disabled:opacity-40"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      size={18}
                      className={
                        (localRatings[selectedPhoto.id] || 0) >= star
                          ? 'text-yellow-400'
                          : 'text-white/30'
                      }
                      fill={(localRatings[selectedPhoto.id] || 0) >= star ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                {localComments.filter(c => c.photo_id === selectedPhoto.id).length} Notes
              </span>
            </div>

            {localComments.filter(c => c.photo_id === selectedPhoto.id).length > 0 && (
              <ul className="max-h-24 overflow-y-auto space-y-1">
                {localComments
                  .filter(c => c.photo_id === selectedPhoto.id)
                  .map(c => (
                    <li key={c.id} className="text-[11px] text-white/70">{c.body}</li>
                  ))}
              </ul>
            )}

            {!isSubmitted && (
              <div className="flex gap-2">
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(selectedPhoto.id)}
                  placeholder="Leave a note for your photographer..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/10 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
                />
                <button
                  onClick={() => handleComment(selectedPhoto.id)}
                  disabled={savingComment || !commentDraft.trim()}
                  className="px-4 py-2 bg-white text-black disabled:opacity-40"
                  aria-label="Send note"
                >
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}
