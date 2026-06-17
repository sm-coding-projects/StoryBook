import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle?: boolean;
}

export function createS3Client(config: S3Config): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle ?? true,
  });
}

export async function getPresignedPutUrl(
  client: S3Client,
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export async function getPresignedGetUrl(
  client: S3Client,
  bucket: string,
  key: string,
  expiresIn = 900,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export async function getObject(
  client: S3Client,
  bucket: string,
  key: string,
) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return client.send(command);
}

export async function putObject(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType?: string,
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  return client.send(command);
}

export async function deleteObject(
  client: S3Client,
  bucket: string,
  key: string,
) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return client.send(command);
}

export async function headObject(
  client: S3Client,
  bucket: string,
  key: string,
) {
  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return client.send(command);
}

export { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand };
