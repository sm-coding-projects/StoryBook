'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Download, Loader2 } from 'lucide-react';
import { GalleryGrid, type Photo } from '@/components/GalleryGrid';
import { Lightbox } from '@/components/Lightbox';
import { requestExport } from '@/actions/proofing';
import { createClient } from '@/lib/supabase/client';

interface ExportItem {
  id: string;
  type: string;
  status: string;
  zip_key: string | null;
  created_at: string;
}

interface ProofingViewProps {
  gallery: {
    id: string;
    title: string;
  };
  photos: {
    id: string;
    original_key: string;
    web_key: string | null;
    status: string;
    metadata: Record<string, unknown> | null;
  }[];
  favorites: {
    photo_id: string;
    client_user_id: string;
  }[];
  submissions: {
    id: string;
    client_user_id: string;
    submitted_at: string;
    locked: boolean;
  }[];
  exports: ExportItem[];
  ratings: { photo_id: string; rating: number }[];
  comments: { id: string; photo_id: string; body: string; created_at: string }[];
}

export function ProofingView({ gallery, photos, favorites, submissions, exports, ratings, comments }: ProofingViewProps) {
  const router = useRouter();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const favoritePhotoIds = new Set(favorites.map(f => f.photo_id));

  const favoritePhotos: Photo[] = photos
    .filter(p => favoritePhotoIds.has(p.id) && p.status === 'ready' && p.web_key)
    .map(p => ({
      id: p.id,
      url: `/api/signed-urls?key=${encodeURIComponent(p.web_key as string)}`,
      alt: p.original_key.split('/').pop() || 'Photo',
      width: (p.metadata?.width as number) || 1080,
      height: (p.metadata?.height as number) || 720,
    }));

  const handleExportFilenames = () => {
    const filenames = favoritePhotos.map(p => p.alt).join('\n');
    const blob = new Blob([filenames], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gallery.title.replace(/\s+/g, '-').toLowerCase()}-selections.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportZip = async (type: 'zip_selected' | 'zip_all') => {
    setExporting(true);
    setExportMessage('Export queued — preparing your archive...');
    try {
      const exp = await requestExport(gallery.id, type);
      // Poll until the worker finishes, then refresh the export list
      const supabase = createClient();
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 2500));
        const { data } = await supabase
          .from('exports')
          .select('status')
          .eq('id', exp.id)
          .single();
        if (data?.status === 'ready') {
          setExportMessage('Export ready — download it below.');
          router.refresh();
          setExporting(false);
          return;
        }
        if (data?.status === 'failed') {
          setExportMessage('Export failed — check that there are selected photos.');
          router.refresh();
          setExporting(false);
          return;
        }
      }
      setExportMessage('Export is taking longer than expected — refresh later.');
    } catch (err) {
      setExportMessage(err instanceof Error ? err.message : 'Export failed');
    }
    setExporting(false);
    router.refresh();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 mb-12 border-b border-gray-200 pb-8 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center gap-4 min-w-0 md:gap-6 md:flex-1">
          <button
            onClick={() => router.push(`/admin/editor/${gallery.id}`)}
            className="p-2 hover:bg-white transition-colors shrink-0"
          >
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight break-words min-w-0">Review / {gallery.title}</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            onClick={handleExportFilenames}
            className="px-8 py-4 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-gray-50"
          >
            <Download size={18} /> Export Filenames
          </button>
          <button
            onClick={() => handleExportZip(favorites.length > 0 ? 'zip_selected' : 'zip_all')}
            disabled={exporting}
            className="px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {favorites.length > 0 ? 'Export Selected ZIP' : 'Export All ZIP'}
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="mb-8 px-6 py-4 bg-gray-50 border border-gray-200 text-[11px] font-bold uppercase tracking-widest text-gray-600">
          {exportMessage}
        </div>
      )}

      <div className="bg-white border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 md:p-10 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gray-50/50">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Selected Assets</h3>
            <p className="text-xl font-bold uppercase tracking-tight">{favorites.length} Verified Selections</p>
          </div>
          <div className="self-start sm:self-auto px-4 py-2 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em]">
            {submissions.length > 0 ? 'Client Submitted' : 'Client Review Active'}
          </div>
        </div>

        <div className="p-6 sm:p-8 md:p-10">
          {favoritePhotos.length > 0 ? (
            <GalleryGrid
              photos={favoritePhotos}
              favorites={favoritePhotoIds}
              toggleFavorite={() => {}}
              onPhotoClick={setSelectedPhoto}
            />
          ) : (
            <p className="text-center py-12 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              No client selections yet
            </p>
          )}
        </div>
      </div>

      {exports.length > 0 && (
        <div className="mt-12 bg-white border border-gray-100">
          <div className="p-6 sm:p-8 md:p-10 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Archive Exports</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {exports.map((exp) => (
              <li key={exp.id} className="px-6 sm:px-8 md:px-10 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-900">
                    {exp.type === 'zip_selected' ? 'Selected photos' : 'All photos'}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                    {new Date(exp.created_at).toLocaleString()}
                  </p>
                </div>
                {exp.status === 'ready' && exp.zip_key ? (
                  <a
                    href={`/api/signed-urls?key=${encodeURIComponent(exp.zip_key)}&bucket=exports`}
                    className="self-start sm:self-auto shrink-0 px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
                  >
                    <Download size={14} /> Download
                  </a>
                ) : (
                  <span className={`self-start sm:self-auto shrink-0 text-[10px] font-black uppercase tracking-[0.2em] ${exp.status === 'failed' ? 'text-red-500' : 'text-orange-500'}`}>
                    {exp.status}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Lightbox
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onNext={() => {}}
        onPrev={() => {}}
        isFavorite={selectedPhoto ? favoritePhotoIds.has(selectedPhoto.id) : false}
        onToggleFavorite={() => {}}
        footer={selectedPhoto && (() => {
          const photoRating = ratings.find(r => r.photo_id === selectedPhoto.id)?.rating;
          const photoComments = comments.filter(c => c.photo_id === selectedPhoto.id);
          if (!photoRating && photoComments.length === 0) return null;
          return (
            <div className="max-w-3xl mx-auto px-6 py-4 space-y-2">
              {photoRating != null && (
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">
                  Client rating: {photoRating} / 5
                </p>
              )}
              {photoComments.map(c => (
                <p key={c.id} className="text-[11px] text-white/70">“{c.body}”</p>
              ))}
            </div>
          );
        })()}
      />
    </div>
  );
}
