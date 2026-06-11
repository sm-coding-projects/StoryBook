import { NextRequest, NextResponse } from 'next/server';
import { completeUpload } from '@/actions/upload';

export async function POST(request: NextRequest) {
  try {
    const { photoId } = await request.json();
    const result = await completeUpload(photoId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
