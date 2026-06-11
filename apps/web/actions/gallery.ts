'use server';

import { createClient } from '@/lib/supabase/server';
import { CreateGallerySchema, UpdateGallerySchema } from '@gallery/shared';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function createGallery(formData: {
  title: string;
  privacy?: string;
  allowDownloads?: boolean;
  watermarked?: boolean;
  proofingEnabled?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const input = CreateGallerySchema.parse({
    title: formData.title,
    settings: {
      privacy: formData.privacy || 'invite_only',
      allowDownloads: formData.allowDownloads ?? true,
      watermarked: formData.watermarked ?? false,
      proofingEnabled: formData.proofingEnabled ?? true,
    },
  });

  const { data, error } = await supabase
    .from('galleries')
    .insert({
      owner_id: user.id,
      title: input.title,
      settings: input.settings,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/galleries');
  return data;
}

export async function updateGallery(input: {
  id: string;
  title?: string;
  status?: 'draft' | 'published' | 'archived';
  settings?: Record<string, unknown>;
  cover_photo_id?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const parsed = UpdateGallerySchema.parse(input);

  const updateData: Record<string, unknown> = {};
  if (parsed.title) updateData.title = parsed.title;
  if (parsed.status) updateData.status = parsed.status;
  if (parsed.settings) updateData.settings = parsed.settings;
  if (parsed.cover_photo_id !== undefined) updateData.cover_photo_id = parsed.cover_photo_id;

  const { data, error } = await supabase
    .from('galleries')
    .update(updateData)
    .eq('id', parsed.id)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/galleries');
  revalidatePath(`/admin/editor/${parsed.id}`);
  return data;
}

export async function publishGallery(galleryId: string) {
  return updateGallery({ id: galleryId, status: 'published' });
}

export async function archiveGallery(galleryId: string) {
  return updateGallery({ id: galleryId, status: 'archived' });
}

export async function getGalleries() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('galleries')
    .select(`
      *,
      photos:photos!photos_gallery_id_fkey(count),
      favorites:proof_favorites(count)
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getGallery(galleryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('galleries')
    .select(`
      *,
      photos!photos_gallery_id_fkey(*),
      proof_favorites(*)
    `)
    .eq('id', galleryId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function inviteClient(galleryId: string, email: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Verify ownership
  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, owner_id')
    .eq('id', galleryId)
    .eq('owner_id', user.id)
    .single();

  if (!gallery) throw new Error('Gallery not found');

  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const { error } = await supabase
    .from('invitations')
    .insert({
      gallery_id: galleryId,
      email: email.toLowerCase(),
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

  if (error) throw new Error(error.message);

  // In dev: log to dev_emails and console
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/accept?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    // Send via Resend when configured
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@storybook.systems',
      to: email,
      subject: `You've been invited to view a gallery`,
      html: `<p>You've been invited to view a photo gallery. <a href="${acceptUrl}">Click here to accept</a>.</p>`,
    });
  } else {
    // No email provider configured: log + dev_emails sink
    console.log(`\n📧 Invite email for ${email}:`);
    console.log(`   Accept URL: ${acceptUrl}\n`);

    await supabase.from('dev_emails').insert({
      to_email: email,
      subject: `You've been invited to view a gallery`,
      body_text: `Accept your invite: ${acceptUrl}`,
      body_html: `<p>Accept your invite: <a href="${acceptUrl}">${acceptUrl}</a></p>`,
      meta: { gallery_id: galleryId, type: 'invite' },
    });
  }

  revalidatePath(`/admin/editor/${galleryId}`);
  // Without an email provider the photographer needs the link to share manually.
  return {
    success: true,
    acceptPath: process.env.RESEND_API_KEY ? undefined : `/invite/accept?token=${token}`,
  };
}

export async function acceptInvite(token: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated to accept invite');

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // RLS prevents the invited client from reading the invitation or inserting
  // their own membership — a SECURITY DEFINER function handles the whole
  // acceptance atomically (token check, email match, expiry, membership).
  const { data: galleryId, error } = await supabase.rpc('accept_invitation', {
    invite_token_hash: tokenHash,
  });

  if (error) {
    // Postgres exception messages pass through PostgREST verbatim
    throw new Error(error.message || 'Invalid or expired invitation');
  }

  return { gallery_id: galleryId as string };
}
