import { z } from 'zod';

export const PhotoStatus = z.enum(['uploaded', 'processing', 'ready', 'failed']);
export type PhotoStatus = z.infer<typeof PhotoStatus>;

export const PhotoMetadataSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  captured_at: z.string().datetime().optional(),
  camera_make: z.string().optional(),
  camera_model: z.string().optional(),
  file_size: z.number().int().positive().optional(),
  mime_type: z.string().optional(),
});
export type PhotoMetadata = z.infer<typeof PhotoMetadataSchema>;

export const PhotoRowSchema = z.object({
  id: z.string().uuid(),
  gallery_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  original_key: z.string(),
  web_key: z.string().nullable(),
  thumb_key: z.string().nullable(),
  watermarked_key: z.string().nullable(),
  metadata: PhotoMetadataSchema.nullable(),
  status: PhotoStatus,
  sort_order: z.number().int(),
  created_at: z.string().datetime(),
});
export type PhotoRow = z.infer<typeof PhotoRowSchema>;

export const CreateUploadUrlsSchema = z.object({
  gallery_id: z.string().uuid(),
  files: z.array(z.object({
    filename: z.string(),
    content_type: z.string(),
    size: z.number().int().positive(),
  })).min(1).max(50),
});
export type CreateUploadUrlsInput = z.infer<typeof CreateUploadUrlsSchema>;
