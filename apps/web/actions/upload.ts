'use server';

import { createClient } from '@/lib/supabase/server';
import { getS3Client, getS3Config } from '@/lib/s3';
import { getPresignedPutUrl, BUCKET_ORIGINALS, originalKey } from '@gallery/shared';
import { randomUUID } from 'crypto';

export async function createUploadUrls(input: {
  gallery_id: string;
  files: { filename: string; content_type: string; size: number }[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Verify gallery ownership
  const { data: gallery } = await supabase
    .from('galleries')
    .select('id')
    .eq('id', input.gallery_id)
    .eq('owner_id', user.id)
    .single();

  if (!gallery) throw new Error('Gallery not found');

  const s3Client = getS3Client();
  const config = getS3Config();

  const uploadUrls = await Promise.all(
    input.files.map(async (file) => {
      const photoId = randomUUID();
      const ext = file.filename.split('.').pop() || 'jpg';
      const key = originalKey(input.gallery_id, photoId, ext);

      const url = await getPresignedPutUrl(
        s3Client,
        config.bucket,
        key,
        file.content_type,
        3600,
      );

      // Create photo record
      await supabase.from('photos').insert({
        id: photoId,
        gallery_id: input.gallery_id,
        owner_id: user.id,
        original_key: key,
        status: 'uploaded',
        sort_order: 0,
        metadata: {
          file_size: file.size,
          mime_type: file.content_type,
        },
      });

      return { url, photoId, key };
    })
  );

  return { uploadUrls };
}

export async function completeUpload(photoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Enqueue processing job via pg-boss
  // In production, this inserts a job into the pgboss.job table
  // For now, update the photo status
  const { error } = await supabase
    .from('photos')
    .update({ status: 'processing' })
    .eq('id', photoId)
    .eq('owner_id', user.id);

  if (error) throw new Error(error.message);

  // Insert pg-boss compatible job
  const { error: jobError } = await supabase.rpc('insert_pgboss_job', {
    job_name: 'process-photo',
    job_data: { photoId },
  });

  if (jobError) {
    // Surface the failure — otherwise the photo sits in "processing" forever.
    await supabase
      .from('photos')
      .update({ status: 'failed' })
      .eq('id', photoId)
      .eq('owner_id', user.id);
    throw new Error(`Failed to enqueue processing job: ${jobError.message}`);
  }

  return { success: true };
}
