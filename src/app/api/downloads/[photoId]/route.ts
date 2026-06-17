import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPresignedGetUrl } from "@/lib/s3";

type Params = { params: Promise<{ photoId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { photoId } = await params;

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const url = await getPresignedGetUrl(photo.originalKey, 300);

  return NextResponse.json({ url, filename: photo.filename });
}
