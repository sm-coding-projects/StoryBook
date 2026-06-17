import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import {
  createS3Client,
  getObject,
  putObject,
  WEB_MAX_WIDTH,
  WEB_MAX_HEIGHT,
  WEB_QUALITY,
  THUMB_MAX_WIDTH,
  THUMB_MAX_HEIGHT,
  THUMB_QUALITY,
  BUCKET_ORIGINALS,
  BUCKET_DERIVATIVES,
  webKey,
  thumbKey,
  watermarkedKey,
  WATERMARK_QUALITY,
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
    bucket: process.env.S3_BUCKET || BUCKET_ORIGINALS,
    forcePathStyle: true,
  };
}

export async function processPhotoHandler(job: { data: { photoId: string } }) {
  const { photoId } = job.data;
  console.log(`[ProcessPhoto] Processing photo: ${photoId}`);

  try {
    // Fetch photo record
    const { data: photo, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (error || !photo) {
      throw new Error(`Photo not found: ${photoId}`);
    }

    const s3Config = getS3Config();
    const s3Client = createS3Client(s3Config);

    // Download original
    const origBucket = process.env.S3_BUCKET || BUCKET_ORIGINALS;
    const origResponse = await getObject(s3Client, origBucket, photo.original_key);
    const origBuffer = Buffer.from(await origResponse.Body!.transformToByteArray());

    // Get image metadata (strip GPS EXIF)
    const metadata = await sharp(origBuffer).metadata();

    // Generate web version
    const webBuffer = await sharp(origBuffer)
      .rotate() // auto-rotate based on EXIF
      .resize(WEB_MAX_WIDTH, WEB_MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEB_QUALITY })
      .toBuffer();

    const derivBucket = process.env.S3_DERIVATIVES_BUCKET || BUCKET_DERIVATIVES;
    const wKey = webKey(photo.gallery_id, photoId);
    await putObject(s3Client, derivBucket, wKey, webBuffer, 'image/webp');

    // Generate thumbnail
    const thumbBuffer = await sharp(origBuffer)
      .rotate()
      .resize(THUMB_MAX_WIDTH, THUMB_MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer();

    const tKey = thumbKey(photo.gallery_id, photoId);
    await putObject(s3Client, derivBucket, tKey, thumbBuffer, 'image/webp');

    // Generate watermarked version if gallery settings require it
    const { data: gallery } = await supabase
      .from('galleries')
      .select('settings')
      .eq('id', photo.gallery_id)
      .single();

    let wmKey: string | null = null;
    if (gallery?.settings?.watermarked) {
      const wmBuffer = await sharp(origBuffer)
        .rotate()
        .resize(WEB_MAX_WIDTH, WEB_MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
        .composite([{
          input: Buffer.from(
            `<svg width="400" height="60"><text x="50%" y="50%" font-family="Arial" font-size="24" fill="rgba(255,255,255,0.3)" text-anchor="middle" dominant-baseline="middle">STORYBOOK</text></svg>`
          ),
          gravity: 'center',
        }])
        .webp({ quality: WATERMARK_QUALITY })
        .toBuffer();

      wmKey = watermarkedKey(photo.gallery_id, photoId);
      await putObject(s3Client, derivBucket, wmKey, wmBuffer, 'image/webp');
    }

    // Update photo record with safe metadata subset (no GPS)
    const safeMetadata = {
      width: metadata.width,
      height: metadata.height,
      file_size: origBuffer.length,
      mime_type: `image/${metadata.format}`,
      ...(metadata.exif ? {} : {}), // GPS stripped by not including it
    };

    await supabase
      .from('photos')
      .update({
        web_key: wKey,
        thumb_key: tKey,
        watermarked_key: wmKey,
        metadata: safeMetadata,
        status: 'ready',
      })
      .eq('id', photoId);

    // Write audit event
    await supabase.from('audit_events').insert({
      actor_user_id: photo.owner_id,
      gallery_id: photo.gallery_id,
      type: 'photo_processed',
      payload: { photoId, derivatives: { web: wKey, thumb: tKey, watermarked: wmKey } },
    });

    console.log(`[ProcessPhoto] Completed: ${photoId}`);
  } catch (err) {
    console.error(`[ProcessPhoto] Failed: ${photoId}`, err);

    await supabase
      .from('photos')
      .update({ status: 'failed' })
      .eq('id', photoId);

    throw err;
  }
}
