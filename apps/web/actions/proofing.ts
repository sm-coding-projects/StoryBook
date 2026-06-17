'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleFavorite(galleryId: string, photoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Check if already favorited
  const { data: existing } = await supabase
    .from('proof_favorites')
    .select('gallery_id')
    .eq('gallery_id', galleryId)
    .eq('photo_id', photoId)
    .eq('client_user_id', user.id)
    .single();

  if (existing) {
    await supabase
      .from('proof_favorites')
      .delete()
      .eq('gallery_id', galleryId)
      .eq('photo_id', photoId)
      .eq('client_user_id', user.id);
  } else {
    await supabase
      .from('proof_favorites')
      .insert({
        gallery_id: galleryId,
        photo_id: photoId,
        client_user_id: user.id,
      });
  }

  revalidatePath(`/gallery/${galleryId}`);
  return { favorited: !existing };
}

export async function setRating(galleryId: string, photoId: string, rating: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('proof_ratings')
    .upsert({
      gallery_id: galleryId,
      photo_id: photoId,
      client_user_id: user.id,
      rating,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'gallery_id,photo_id,client_user_id' });

  if (error) throw new Error(error.message);
  revalidatePath(`/gallery/${galleryId}`);
}

export async function addComment(galleryId: string, photoId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('proof_comments')
    .insert({
      gallery_id: galleryId,
      photo_id: photoId,
      client_user_id: user.id,
      body,
    });

  if (error) throw new Error(error.message);
  revalidatePath(`/gallery/${galleryId}`);
}

export async function submitSelection(galleryId: string, note?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Check if already submitted
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('gallery_id', galleryId)
    .eq('client_user_id', user.id)
    .eq('locked', true)
    .single();

  if (existing) {
    throw new Error('Selection already submitted and locked');
  }

  const { error } = await supabase
    .from('submissions')
    .insert({
      gallery_id: galleryId,
      client_user_id: user.id,
      note: note || null,
      locked: true,
    });

  if (error) throw new Error(error.message);

  // Log audit event
  await supabase.from('audit_events').insert({
    actor_user_id: user.id,
    gallery_id: galleryId,
    type: 'submission_created',
    payload: { note },
  });

  revalidatePath(`/gallery/${galleryId}`);
  return { success: true };
}

export async function requestExport(galleryId: string, type: 'zip_selected' | 'zip_all') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('exports')
    .insert({
      gallery_id: galleryId,
      requested_by: user.id,
      type,
      status: 'queued',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Enqueue job
  const { error: jobError } = await supabase.rpc('insert_pgboss_job', {
    job_name: 'generate-export',
    job_data: { exportId: data.id },
  });

  if (jobError) {
    await supabase.from('exports').update({ status: 'failed' }).eq('id', data.id);
    throw new Error(`Failed to enqueue export job: ${jobError.message}`);
  }

  return data;
}

export async function getClientFavorites(galleryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('proof_favorites')
    .select('photo_id')
    .eq('gallery_id', galleryId)
    .eq('client_user_id', user.id);

  if (error) throw new Error(error.message);
  return new Set(data.map((f: { photo_id: string }) => f.photo_id));
}
