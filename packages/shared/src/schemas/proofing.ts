import { z } from 'zod';

export const ToggleFavoriteSchema = z.object({
  gallery_id: z.string().uuid(),
  photo_id: z.string().uuid(),
});
export type ToggleFavoriteInput = z.infer<typeof ToggleFavoriteSchema>;

export const SetRatingSchema = z.object({
  gallery_id: z.string().uuid(),
  photo_id: z.string().uuid(),
  rating: z.number().int().min(0).max(5),
});
export type SetRatingInput = z.infer<typeof SetRatingSchema>;

export const CreateCommentSchema = z.object({
  gallery_id: z.string().uuid(),
  photo_id: z.string().uuid(),
  body: z.string().min(1).max(2000),
});
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

export const SubmitSelectionSchema = z.object({
  gallery_id: z.string().uuid(),
  note: z.string().max(5000).optional(),
});
export type SubmitSelectionInput = z.infer<typeof SubmitSelectionSchema>;

export const ExportType = z.enum(['zip_selected', 'zip_all']);
export type ExportType = z.infer<typeof ExportType>;

export const ExportStatus = z.enum(['queued', 'processing', 'ready', 'failed']);
export type ExportStatus = z.infer<typeof ExportStatus>;

export const RequestExportSchema = z.object({
  gallery_id: z.string().uuid(),
  type: ExportType,
});
export type RequestExportInput = z.infer<typeof RequestExportSchema>;
