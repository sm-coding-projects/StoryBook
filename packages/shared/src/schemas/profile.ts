import { z } from 'zod';

export const UserRole = z.enum(['photographer', 'client']);
export type UserRole = z.infer<typeof UserRole>;

export const WatermarkSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().optional(),
  opacity: z.number().min(0).max(1).default(0.3),
  position: z.enum(['center', 'bottom-right', 'bottom-left', 'top-right', 'top-left']).default('center'),
});
export type WatermarkSettings = z.infer<typeof WatermarkSettingsSchema>;

export const ProfileRowSchema = z.object({
  user_id: z.string().uuid(),
  role: UserRole,
  studio_name: z.string().nullable(),
  watermark_settings: WatermarkSettingsSchema.nullable(),
  created_at: z.string().datetime(),
});
export type ProfileRow = z.infer<typeof ProfileRowSchema>;

export const UpdateProfileSchema = z.object({
  studio_name: z.string().max(200).optional(),
  watermark_settings: WatermarkSettingsSchema.optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
