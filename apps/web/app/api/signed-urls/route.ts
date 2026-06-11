import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getS3Client, getS3Config } from '@/lib/s3';
import { getPresignedGetUrl, BUCKET_DERIVATIVES, BUCKET_EXPORTS } from '@gallery/shared';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const key = request.nextUrl.searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }

    const s3Client = getS3Client();
    getS3Config();
    // Only the two read-facing buckets are exposed; derivatives is the default.
    const bucket =
      request.nextUrl.searchParams.get('bucket') === 'exports'
        ? process.env.S3_EXPORTS_BUCKET || BUCKET_EXPORTS
        : process.env.S3_DERIVATIVES_BUCKET || BUCKET_DERIVATIVES;

    const url = await getPresignedGetUrl(s3Client, bucket, key, 900);

    // Redirect to the signed URL
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
