import { createS3Client, type S3Config } from '@gallery/shared';

export function getS3Config(): S3Config {
  return {
    endpoint: process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    bucket: process.env.S3_BUCKET || 'gallery-originals',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  };
}

let _s3Client: ReturnType<typeof createS3Client> | null = null;

export function getS3Client() {
  if (!_s3Client) {
    _s3Client = createS3Client(getS3Config());
  }
  return _s3Client;
}
