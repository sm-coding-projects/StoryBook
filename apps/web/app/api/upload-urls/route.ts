import { NextRequest, NextResponse } from 'next/server';
import { createUploadUrls } from '@/actions/upload';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createUploadUrls(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
