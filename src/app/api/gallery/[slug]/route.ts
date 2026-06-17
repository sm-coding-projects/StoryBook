import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const gallery = await prisma.gallery.findUnique({
    where: { slug },
    include: {
      collections: {
        orderBy: { sortOrder: "asc" },
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
        },
      },
      user: { select: { id: true, name: true, image: true } },
    },
  });

  if (!gallery || !gallery.isPublished) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  // If password-protected, don't return photos without verification
  if (gallery.password) {
    return NextResponse.json({
      gallery: {
        id: gallery.id,
        name: gallery.name,
        slug: gallery.slug,
        description: gallery.description,
        coverPhotoId: gallery.coverPhotoId,
        isPasswordProtected: true,
        user: gallery.user,
      },
    });
  }

  const { password: _, ...safeGallery } = gallery;
  return NextResponse.json({ gallery: { ...safeGallery, isPasswordProtected: false } });
}
