// S3 bucket names
export const BUCKET_ORIGINALS = 'gallery-originals';
export const BUCKET_DERIVATIVES = 'gallery-derivatives';
export const BUCKET_EXPORTS = 'gallery-exports';

// S3 key prefixes
export function originalKey(galleryId: string, photoId: string, ext: string) {
  return `${galleryId}/originals/${photoId}.${ext}`;
}

export function webKey(galleryId: string, photoId: string) {
  return `${galleryId}/web/${photoId}.webp`;
}

export function thumbKey(galleryId: string, photoId: string) {
  return `${galleryId}/thumb/${photoId}.webp`;
}

export function watermarkedKey(galleryId: string, photoId: string) {
  return `${galleryId}/watermarked/${photoId}.webp`;
}

export function exportZipKey(galleryId: string, exportId: string) {
  return `${galleryId}/exports/${exportId}.zip`;
}

// Image processing
export const WEB_MAX_WIDTH = 2048;
export const WEB_MAX_HEIGHT = 2048;
export const WEB_QUALITY = 85;

export const THUMB_MAX_WIDTH = 400;
export const THUMB_MAX_HEIGHT = 400;
export const THUMB_QUALITY = 80;

export const WATERMARK_QUALITY = 85;

// Invite token
export const INVITE_TOKEN_BYTES = 32;
export const INVITE_EXPIRY_DAYS = 14;

// Rate limits
export const RATE_LIMIT_INVITE_ACCEPT = { windowMs: 15 * 60 * 1000, max: 10 };
export const RATE_LIMIT_SIGNED_URLS = { windowMs: 60 * 1000, max: 100 };

// Feature flags
export const FEATURES = {
  STRIPE_BILLING: false,
  SENTRY: process.env.SENTRY_DSN ? true : false,
} as const;

// pg-boss job names
export const JOB_PROCESS_PHOTO = 'process-photo';
export const JOB_GENERATE_EXPORT = 'generate-export';
export const JOB_SEND_EMAIL = 'send-email';
