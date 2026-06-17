import { z } from 'zod';

export const GalleryStatus = z.enum(['draft', 'published', 'archived']);
export type GalleryStatus = z.infer<typeof GalleryStatus>;

export const GallerySettingsSchema = z.object({
  privacy: z.enum(['public', 'password', 'invite_only']).default('invite_only'),
  password: z.string().optional(),
  allowDownloads: z.boolean().default(true),
  watermarked: z.boolean().default(false),
  proofingEnabled: z.boolean().default(true),
  proofingLimit: z.number().int().positive().optional(),
});
export type GallerySettings = z.infer<typeof GallerySettingsSchema>;

export const CreateGallerySchema = z.object({
  title: z.string().min(1, 'Gallery title is required').max(200),
  settings: GallerySettingsSchema.optional(),
});
export type CreateGalleryInput = z.infer<typeof CreateGallerySchema>;

export const UpdateGallerySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  status: GalleryStatus.optional(),
  settings: GallerySettingsSchema.partial().optional(),
  cover_photo_id: z.string().uuid().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
});
export type UpdateGalleryInput = z.infer<typeof UpdateGallerySchema>;

export const GalleryRowSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  title: z.string(),
  status: GalleryStatus,
  settings: GallerySettingsSchema,
  cover_photo_id: z.string().uuid().nullable(),
  expires_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type GalleryRow = z.infer<typeof GalleryRowSchema>;
