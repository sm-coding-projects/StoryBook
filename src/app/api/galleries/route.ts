import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const galleries = await prisma.gallery.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      collections: {
        include: {
          photos: { select: { id: true, thumbnailKey: true } },
        },
      },
    },
  });

  const result = galleries.map((g) => {
    const allPhotos = g.collections.flatMap((c) => c.photos);
    const coverPhoto = allPhotos[0];
    return {
      id: g.id,
      name: g.name,
      slug: g.slug,
      isPublished: g.isPublished,
      coverPhotoUrl: null,
      _count: {
        collections: g.collections.length,
        photos: allPhotos.length,
      },
      createdAt: g.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ galleries: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + nanoid(6);

  const gallery = await prisma.gallery.create({
    data: {
      name,
      slug,
      description: description || null,
      userId: session.user.id,
      collections: {
        create: { name: "All Photos", sortOrder: 0 },
      },
    },
    include: { collections: true },
  });

  return NextResponse.json({ gallery }, { status: 201 });
}
