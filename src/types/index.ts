import type { Gallery, Collection, Photo, User } from "@prisma/client";

// Extended types with relations
export type GalleryWithCollections = Gallery & {
  collections: CollectionWithPhotos[];
};

export type CollectionWithPhotos = Collection & {
  photos: Photo[];
};

export type GalleryWithUser = Gallery & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

// API response types
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Upload types
export type PresignedUrlResponse = {
  url: string;
  key: string;
  fields?: Record<string, string>;
};

export type PhotoUploadResult = {
  id: string;
  originalKey: string;
  webKey: string;
  thumbnailKey: string;
  width: number;
  height: number;
  size: number;
};

// Gallery settings for sharing
export type GalleryShareSettings = {
  isPublished: boolean;
  password: string | null;
  slug: string;
};

// Re-export Prisma types for convenience
export type { Gallery, Collection, Photo, User };
