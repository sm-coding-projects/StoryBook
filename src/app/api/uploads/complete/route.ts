import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getObjectBuffer, uploadBuffer } from "@/lib/s3";
import {
  generateThumbnail,
  generateWebSize,
  getImageDimensions,
} from "@/lib/image-processing";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, filename, collectionId } = await req.json();

  if (!key || !filename || !collectionId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Verify collection belongs to user
  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      gallery: { userId: session.user.id },
    },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 }
    );
  }

  const originalBuffer = await getObjectBuffer(key);
  const { width, height } = await getImageDimensions(originalBuffer);

  const baseKey = key.replace(/\.[^.]+$/, "");

  const [thumbnailBuffer, webBuffer] = await Promise.all([
    generateThumbnail(originalBuffer),
    generateWebSize(originalBuffer),
  ]);

  const thumbnailKey = `${baseKey}_thumb.jpg`;
  const webKey = `${baseKey}_web.jpg`;

  await Promise.all([
    uploadBuffer(thumbnailKey, thumbnailBuffer, "image/jpeg"),
    uploadBuffer(webKey, webBuffer, "image/jpeg"),
  ]);

  const photoCount = await prisma.photo.count({
    where: { collectionId },
  });

  const photo = await prisma.photo.create({
    data: {
      filename,
      originalKey: key,
      webKey,
      thumbnailKey,
      width,
      height,
      size: originalBuffer.length,
      collectionId,
      sortOrder: photoCount,
    },
  });

  return NextResponse.json({ photo });
}
