import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, galleryId } = await req.json();

  if (!name || !galleryId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Verify gallery belongs to user
  const gallery = await prisma.gallery.findFirst({
    where: { id: galleryId, userId: session.user.id },
  });

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  const collectionCount = await prisma.collection.count({
    where: { galleryId },
  });

  const collection = await prisma.collection.create({
    data: {
      name,
      galleryId,
      sortOrder: collectionCount,
    },
  });

  return NextResponse.json({ collection }, { status: 201 });
}
