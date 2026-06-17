import archiver from 'archiver';
import { Writable } from 'stream';
import { createClient } from '@supabase/supabase-js';
import {
  createS3Client,
  getObject,
  putObject,
  BUCKET_DERIVATIVES,
  BUCKET_EXPORTS,
  exportZipKey,
} from '@gallery/shared';
import type { S3Config } from '@gallery/shared';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

function getS3Config(): S3Config {
  return {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
    bucket: BUCKET_DERIVATIVES,
    forcePathStyle: true,
  };
}

export async function generateExportHandler(job: { data: { exportId: string } }) {
  const { exportId } = job.data;
  console.log(`[GenerateExport] Processing export: ${exportId}`);

  try {
    const { data: exportRecord, error } = await supabase
      .from('exports')
      .select('*')
      .eq('id', exportId)
      .single();

    if (error || !exportRecord) {
      throw new Error(`Export not found: ${exportId}`);
    }

    // Update status
    await supabase
      .from('exports')
      .update({ status: 'processing' })
      .eq('id', exportId);

    // Get photos to include
    let photoQuery = supabase
      .from('photos')
      .select('*')
      .eq('gallery_id', exportRecord.gallery_id)
      .eq('status', 'ready');

    if (exportRecord.type === 'zip_selected') {
      // Get favorited photo IDs
      const { data: favorites } = await supabase
        .from('proof_favorites')
        .select('photo_id')
        .eq('gallery_id', exportRecord.gallery_id);

      const favIds = (favorites || []).map((f: { photo_id: string }) => f.photo_id);
      if (favIds.length === 0) {
        throw new Error('No selected photos to export');
      }
      photoQuery = photoQuery.in('id', favIds);
    }

    const { data: photos } = await photoQuery;
    if (!photos || photos.length === 0) {
      throw new Error('No photos to export');
    }

    const s3Config = getS3Config();
    const s3Client = createS3Client(s3Config);

    // Create ZIP in memory
    const chunks: Buffer[] = [];
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    const archive = archiver('zip', { zlib: { level: 5 } });
    // Attach completion handlers BEFORE finalize — for small archives the
    // 'finish' event fires during the finalize() await, and a listener
    // attached afterwards never resolves.
    const finished = new Promise<void>((resolve, reject) => {
      writable.on('finish', resolve);
      writable.on('error', reject);
      archive.on('error', reject);
    });
    archive.pipe(writable);

    // Add each photo to ZIP
    for (const photo of photos) {
      const key = photo.web_key || photo.original_key;
      try {
        const response = await getObject(s3Client, s3Config.bucket, key);
        const buffer = Buffer.from(await response.Body!.transformToByteArray());
        const filename = photo.original_key.split('/').pop() || `${photo.id}.webp`;
        archive.append(buffer, { name: filename });
      } catch (err) {
        console.warn(`[GenerateExport] Skipping photo ${photo.id}:`, err);
      }
    }

    await archive.finalize();
    await finished;

    const zipBuffer = Buffer.concat(chunks);
    const zipBucket = process.env.S3_EXPORTS_BUCKET || BUCKET_EXPORTS;
    const zipKeyPath = exportZipKey(exportRecord.gallery_id, exportId);

    await putObject(s3Client, zipBucket, zipKeyPath, zipBuffer, 'application/zip');

    // Update export record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase
      .from('exports')
      .update({
        zip_key: zipKeyPath,
        status: 'ready',
        expires_at: expiresAt.toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', exportId);

    // Audit event
    await supabase.from('audit_events').insert({
      actor_user_id: exportRecord.requested_by,
      gallery_id: exportRecord.gallery_id,
      type: 'export_completed',
      payload: { exportId, photoCount: photos.length },
    });

    // Dev email notification
    if (process.env.NODE_ENV === 'development') {
      await supabase.from('dev_emails').insert({
        to_email: 'photographer@demo.com',
        subject: 'Your export is ready',
        body_text: `Export ${exportId} is ready for download.`,
        meta: { exportId, gallery_id: exportRecord.gallery_id },
      });
    }

    console.log(`[GenerateExport] Completed: ${exportId} (${photos.length} photos)`);
  } catch (err) {
    console.error(`[GenerateExport] Failed: ${exportId}`, err);
    await supabase
      .from('exports')
      .update({ status: 'failed' })
      .eq('id', exportId);
    throw err;
  }
}
