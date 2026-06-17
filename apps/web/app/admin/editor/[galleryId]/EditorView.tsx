'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Eye,
  Heart,
  Lock,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { UploadZone } from '@/components/UploadZone';
import { GalleryGrid, type Photo } from '@/components/GalleryGrid';
import { Lightbox } from '@/components/Lightbox';
import { inviteClient, updateGallery } from '@/actions/gallery';

interface EditorViewProps {
  gallery: {
    id: string;
    title: string;
    status: string;
    settings: Record<string, unknown>;
    created_at: string;
  };
  photos: {
    id: string;
    original_key: string;
    web_key: string | null;
    thumb_key: string | null;
    status: string;
    metadata: Record<string, unknown> | null;
  }[];
  invitations: {
    id: string;
    email: string;
    status: string;
    created_at: string;
  }[];
}

export function EditorView({ gallery, photos, invitations }: EditorViewProps) {
  const router = useRouter();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const handleTogglePublish = async () => {
    setPublishing(true);
    try {
      await updateGallery({
        id: gallery.id,
        status: gallery.status === 'published' ? 'draft' : 'published',
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to update gallery status:', err);
    }
    setPublishing(false);
  };

  // Convert DB photos to UI Photo type
  const uiPhotos: Photo[] = photos
    .filter(p => p.status === 'ready' && p.web_key)
    .map(p => ({
      id: p.id,
      url: `/api/signed-urls?key=${encodeURIComponent(p.web_key as string)}`,
      alt: p.original_key.split('/').pop() || 'Photo',
      width: (p.metadata?.width as number) || 1080,
      height: (p.metadata?.height as number) || 720,
    }));

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError(null);
    setInviteLink(null);
    try {
      const result = await inviteClient(gallery.id, inviteEmail);
      setInviteEmail('');
      if (result.acceptPath) {
        // No email provider configured — surface the link for manual sharing
        setInviteLink(`${window.location.origin}${result.acceptPath}`);
      }
      router.refresh();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite');
    }
    setInviting(false);
  };

  const privacy = (gallery.settings as Record<string, unknown>)?.privacy as string || 'invite_only';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 mb-8 sm:mb-12 border-b border-gray-200 pb-6 sm:pb-8 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-4 min-w-0 sm:gap-6 sm:flex-1">
          <button
            onClick={() => router.push('/admin/galleries')}
            className="p-2 hover:bg-white rounded-none transition-colors shrink-0"
          >
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight truncate">{gallery.title}</h2>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <button
            onClick={() => router.push(`/gallery/${gallery.id}`)}
            className="px-6 py-3 bg-white border border-gray-200 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={() => router.push(`/admin/proofing/${gallery.id}`)}
            className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <Heart size={14} /> Review Proofs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-8 lg:col-span-8 lg:space-y-12 min-w-0">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">01 / Assets</h3>
            </div>
            <div className="bg-white p-5 sm:p-8 border border-gray-100">
              <UploadZone galleryId={gallery.id} onComplete={() => router.refresh()} />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6">02 / Grid View</h3>
            <div className="bg-white p-5 sm:p-8 border border-gray-100">
              <GalleryGrid
                photos={uiPhotos}
                favorites={new Set()}
                toggleFavorite={() => {}}
                onPhotoClick={setSelectedPhoto}
              />
            </div>
          </section>
        </div>

        <div className="space-y-8 lg:col-span-4 lg:space-y-12 min-w-0">
          <section className="bg-white p-5 sm:p-8 border border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Configuration</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-gray-400">Privacy</span>
                <span className="flex items-center gap-2 font-black text-black"><Lock size={12} /> {privacy}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-gray-400">Proofing</span>
                <span className="text-black font-black">Active</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-gray-400">Release</span>
                <span className="text-black font-black">{gallery.created_at.split('T')[0]}</span>
              </div>
            </div>
            <button
              onClick={handleTogglePublish}
              disabled={publishing}
              className={`w-full mt-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors disabled:opacity-50 ${
                gallery.status === 'published'
                  ? 'border border-gray-200 hover:bg-gray-50'
                  : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              {publishing ? '...' : gallery.status === 'published' ? 'Unpublish' : 'Publish Gallery'}
            </button>
            <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Status: {gallery.status}
            </p>
          </section>

          <section className="bg-black text-white p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <ExternalLink size={18} className="shrink-0" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Direct Access</h3>
            </div>
            <div className="bg-white/5 p-4 mb-6 min-w-0">
              <code className="block text-[10px] text-white/50 break-all font-mono">
                {typeof window !== 'undefined' ? window.location.origin : ''}/gallery/{gallery.id}
              </code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/gallery/${gallery.id}`);
              }}
              className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-100 transition-colors"
            >
              Copy Identification
            </button>
          </section>

          {/* Invite Clients */}
          <section className="bg-white p-5 sm:p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Mail size={18} className="shrink-0" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Invite Client</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="client@email.com"
                className="flex-1 min-w-0 px-4 py-3 bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail}
                className="shrink-0 px-4 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              >
                {inviting ? '...' : 'Send'}
              </button>
            </div>

            {inviteError && (
              <p className="mt-4 text-[11px] font-bold text-red-500">{inviteError}</p>
            )}
            {inviteLink && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                  Share this invite link
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 px-2 py-2 bg-white border border-gray-200 text-[11px] text-gray-700 outline-none"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(inviteLink)}
                    className="shrink-0 px-3 py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {invitations.length > 0 && (
              <div className="mt-6 space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Sent Invites</h4>
                {invitations.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-600 truncate">{inv.email}</span>
                    <span className={`font-black uppercase tracking-wider text-[9px] px-2 py-1 ${
                      inv.status === 'accepted' ? 'bg-green-50 text-green-600' :
                      inv.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Lightbox
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onNext={() => {}}
        onPrev={() => {}}
        isFavorite={false}
        onToggleFavorite={() => {}}
      />
    </div>
  );
}
