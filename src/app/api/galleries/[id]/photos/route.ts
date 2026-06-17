import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/s3";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { photoIds } = await req.json();

  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return NextResponse.json({ error: "photoIds required" }, { status: 400 });
  }

  // Verify gallery belongs to user
  const gallery = await prisma.gallery.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  // Get photos to delete their S3 objects
  const photos = await prisma.photo.findMany({
    where: {
      id: { in: photoIds },
      collection: { galleryId: id },
    },
  });

  // Delete S3 objects
  await Promise.allSettled(
    photos.flatMap((p) =>
      [p.originalKey, p.webKey, p.thumbnailKey]
        .filter(Boolean)
        .map((key) => deleteObject(key!))
    )
  );

  // Delete from DB
  await prisma.photo.deleteMany({
    where: { id: { in: photos.map((p) => p.id) } },
  });

  return NextResponse.json({ deleted: photos.length });
}
