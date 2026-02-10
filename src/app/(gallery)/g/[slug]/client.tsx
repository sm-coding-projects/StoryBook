"use client";

import { useEffect, useState, useCallback } from "react";
import { GalleryView } from "@/components/gallery/gallery-view";
import { Lightbox } from "@/components/gallery/lightbox";
import { Slideshow } from "@/components/gallery/slideshow";
import { PasswordGate } from "@/components/gallery/password-gate";
import { useGalleryStore } from "@/stores/gallery-store";
import type { CollectionWithPhotos } from "@/types";

interface GalleryData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverPhotoId?: string | null;
  isPasswordProtected: boolean;
  collections?: CollectionWithPhotos[];
  user?: { id: string; name: string | null; image: string | null };
}

export function GalleryPageClient({ slug }: { slug: string }) {
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGallery = useCallback(async () => {
    try {
      const res = await fetch(`/api/gallery/${slug}`);
      if (!res.ok) {
        setError("Gallery not found");
        return;
      }
      const data = await res.json();
      setGallery(data.gallery);
    } catch {
      setError("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/gallery/${slug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setGallery(data.gallery);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-light text-neutral-900">
            Gallery not found
          </h1>
          <p className="text-sm text-neutral-500">
            This gallery may have been removed or is not yet published.
          </p>
        </div>
      </div>
    );
  }

  // Initialize favorites from DB data
  useEffect(() => {
    if (gallery?.collections) {
      const favIds = gallery.collections
        .flatMap((c) => c.photos)
        .filter((p) => p.isFavorite)
        .map((p) => p.id);
      if (favIds.length > 0) {
        const store = useGalleryStore.getState();
        const favSet = new Set(favIds);
        useGalleryStore.setState({ favorites: favSet });
      }
    }
  }, [gallery?.collections]);

  const handleDownload = useCallback(async (photoId: string) => {
    try {
      const res = await fetch(`/api/downloads/${photoId}`);
      if (!res.ok) return;
      const data = await res.json();
      const fileRes = await fetch(data.url);
      const blob = await fileRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = data.filename || "photo.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // silent
    }
  }, []);

  if (gallery.isPasswordProtected && !gallery.collections) {
    return (
      <PasswordGate
        galleryName={gallery.name}
        onVerify={handlePasswordVerify}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Cover section */}
      {gallery.coverPhotoId && gallery.collections && (
        <GalleryCover
          gallery={gallery}
          collections={gallery.collections}
        />
      )}

      <GalleryView
        galleryName={gallery.name}
        photographerName={gallery.user?.name ?? undefined}
        collections={gallery.collections ?? []}
        getPhotoUrl={getPhotoUrls}
      />

      <Lightbox onDownload={handleDownload} />
      <Slideshow />

      {/* Footer */}
      <footer className="py-8 text-center border-t border-neutral-100">
        <p className="text-xs text-neutral-400">
          Powered by{" "}
          <span className="font-medium text-neutral-500">StoryBook</span>
        </p>
      </footer>
    </div>
  );
}

function GalleryCover({
  gallery,
  collections,
}: {
  gallery: GalleryData;
  collections: CollectionWithPhotos[];
}) {
  // Find cover photo
  const coverPhoto = collections
    .flatMap((c) => c.photos)
    .find((p) => p.id === gallery.coverPhotoId);

  if (!coverPhoto) return null;

  const { url } = getPhotoUrls(coverPhoto);

  return (
    <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
      <img
        src={url}
        alt={gallery.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight">
          {gallery.name}
        </h1>
        {gallery.description && (
          <p className="text-white/80 text-lg mt-2 max-w-xl">
            {gallery.description}
          </p>
        )}
        {gallery.user?.name && (
          <p className="text-white/60 text-sm mt-3">
            by {gallery.user.name}
          </p>
        )}
      </div>
    </div>
  );
}

function getPhotoUrls(photo: {
  thumbnailKey?: string | null;
  webKey?: string | null;
  originalKey: string;
}) {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "";
  return {
    thumbnailUrl: `${base}/${photo.thumbnailKey || photo.originalKey}`,
    url: `${base}/${photo.webKey || photo.originalKey}`,
  };
}
