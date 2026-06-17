"use client";

import { useMemo, useState } from "react";
import { useGalleryStore, type GalleryPhoto } from "@/stores/gallery-store";
import { GalleryGrid } from "./gallery-grid";
import { GalleryGridUniform } from "./gallery-grid-uniform";
import { GalleryHeader } from "./gallery-header";
import { CollectionTabs } from "./collection-tabs";
import type { CollectionWithPhotos } from "@/types";

interface GalleryViewProps {
  galleryName: string;
  photographerName?: string;
  collections: CollectionWithPhotos[];
  getPhotoUrl: (photo: { thumbnailKey?: string | null; webKey?: string | null; originalKey: string }) => {
    thumbnailUrl: string;
    url: string;
  };
}

export function GalleryView({
  galleryName,
  photographerName,
  collections,
  getPhotoUrl,
}: GalleryViewProps) {
  const { viewMode, favorites } = useGalleryStore();
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null
  );
  const [showFavorites, setShowFavorites] = useState(false);

  const collectionTabs = useMemo(
    () =>
      collections.map((c) => ({
        id: c.id,
        name: c.name,
        photoCount: c.photos.length,
      })),
    [collections]
  );

  const allPhotos: GalleryPhoto[] = useMemo(() => {
    const filtered = activeCollectionId
      ? collections.filter((c) => c.id === activeCollectionId)
      : collections;

    return filtered.flatMap((col) =>
      col.photos.map((photo) => {
        const urls = getPhotoUrl(photo);
        return {
          id: photo.id,
          url: urls.url,
          thumbnailUrl: urls.thumbnailUrl,
          width: photo.width ?? 0,
          height: photo.height ?? 0,
          filename: photo.filename,
        };
      })
    );
  }, [collections, activeCollectionId, getPhotoUrl]);

  const displayPhotos = showFavorites
    ? allPhotos.filter((p) => favorites.has(p.id))
    : allPhotos;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <GalleryHeader
        galleryName={galleryName}
        photographerName={photographerName}
        photoCount={allPhotos.length}
        favoriteCount={favorites.size}
        showFavorites={showFavorites}
        onShowFavorites={() => setShowFavorites(!showFavorites)}
      />

      <CollectionTabs
        collections={collectionTabs}
        activeId={activeCollectionId}
        onSelect={(id) => {
          setActiveCollectionId(id);
          setShowFavorites(false);
        }}
      />

      {viewMode === "masonry" ? (
        <GalleryGrid photos={displayPhotos} />
      ) : (
        <GalleryGridUniform photos={displayPhotos} />
      )}
    </div>
  );
}
