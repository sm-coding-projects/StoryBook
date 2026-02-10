import { create } from "zustand";

export type ViewMode = "grid" | "masonry";

export interface GalleryPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  filename: string;
}

interface GalleryState {
  // Photos
  photos: GalleryPhoto[];
  currentPhotoIndex: number;

  // Lightbox
  lightboxOpen: boolean;

  // Slideshow
  slideshowActive: boolean;
  slideshowInterval: number;

  // Favorites
  favorites: Set<string>;

  // View
  viewMode: ViewMode;
}

interface GalleryActions {
  setPhotos: (photos: GalleryPhoto[]) => void;

  openLightbox: (index: number) => void;
  closeLightbox: () => void;
  nextPhoto: () => void;
  prevPhoto: () => void;
  goToPhoto: (index: number) => void;

  toggleFavorite: (photoId: string) => void;
  clearFavorites: () => void;

  startSlideshow: () => void;
  stopSlideshow: () => void;

  setViewMode: (mode: ViewMode) => void;
}

export const useGalleryStore = create<GalleryState & GalleryActions>(
  (set, get) => ({
    photos: [],
    currentPhotoIndex: 0,
    lightboxOpen: false,
    slideshowActive: false,
    slideshowInterval: 3000,
    favorites: new Set<string>(),
    viewMode: "masonry",

    setPhotos: (photos) => set({ photos }),

    openLightbox: (index) =>
      set({ lightboxOpen: true, currentPhotoIndex: index }),

    closeLightbox: () =>
      set({ lightboxOpen: false, slideshowActive: false }),

    nextPhoto: () => {
      const { photos, currentPhotoIndex } = get();
      if (photos.length === 0) return;
      set({ currentPhotoIndex: (currentPhotoIndex + 1) % photos.length });
    },

    prevPhoto: () => {
      const { photos, currentPhotoIndex } = get();
      if (photos.length === 0) return;
      set({
        currentPhotoIndex:
          (currentPhotoIndex - 1 + photos.length) % photos.length,
      });
    },

    goToPhoto: (index) => set({ currentPhotoIndex: index }),

    toggleFavorite: (photoId) => {
      const favorites = new Set(get().favorites);
      if (favorites.has(photoId)) {
        favorites.delete(photoId);
      } else {
        favorites.add(photoId);
      }
      set({ favorites });
    },

    clearFavorites: () => set({ favorites: new Set<string>() }),

    startSlideshow: () => set({ slideshowActive: true, lightboxOpen: true }),

    stopSlideshow: () => set({ slideshowActive: false }),

    setViewMode: (mode) => set({ viewMode: mode }),
  })
);
