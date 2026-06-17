import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const { password } = await req.json();

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

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

  if (!gallery.password) {
    const { password: _, ...safeGallery } = gallery;
    return NextResponse.json({ gallery: { ...safeGallery, isPasswordProtected: false } });
  }

  const isValid = await bcrypt.compare(password, gallery.password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const { password: _, ...safeGallery } = gallery;
  return NextResponse.json({ gallery: { ...safeGallery, isPasswordProtected: false } });
}
