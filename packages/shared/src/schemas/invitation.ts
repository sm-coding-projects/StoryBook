import { z } from 'zod';

export const InvitationStatus = z.enum(['pending', 'accepted', 'expired', 'revoked']);
export type InvitationStatus = z.infer<typeof InvitationStatus>;

export const CreateInvitationSchema = z.object({
  gallery_id: z.string().uuid(),
  email: z.string().email('Valid email is required'),
});
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;

export const InvitationRowSchema = z.object({
  id: z.string().uuid(),
  gallery_id: z.string().uuid(),
  email: z.string().email(),
  token_hash: z.string(),
  status: InvitationStatus,
  expires_at: z.string().datetime(),
  created_at: z.string().datetime(),
  accepted_at: z.string().datetime().nullable(),
});
export type InvitationRow = z.infer<typeof InvitationRowSchema>;
