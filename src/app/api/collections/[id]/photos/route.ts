import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);

  // Verify collection belongs to user
  const collection = await prisma.collection.findFirst({
    where: { id, gallery: { userId: session.user.id } },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 }
    );
  }

  const photos = await prisma.photo.findMany({
    where: { collectionId: id },
    orderBy: { sortOrder: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = photos.length > limit;
  if (hasMore) photos.pop();

  return NextResponse.json({
    photos,
    nextCursor: hasMore ? photos[photos.length - 1].id : null,
  });
}
