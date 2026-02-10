import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPresignedGetUrl } from "@/lib/s3";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { thumbnailKey: true, webKey: true, originalKey: true },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const key = photo.thumbnailKey || photo.webKey || photo.originalKey;
  const url = await getPresignedGetUrl(key, 3600);

  return NextResponse.redirect(url);
}
