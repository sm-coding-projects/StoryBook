import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const gallery = await prisma.gallery.findFirst({
    where: { id, userId: session.user.id },
    include: {
      collections: {
        orderBy: { sortOrder: "asc" },
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  return NextResponse.json({ gallery });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const gallery = await prisma.gallery.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.slug !== undefined) {
    // Check slug uniqueness
    const existing = await prisma.gallery.findUnique({ where: { slug: body.slug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }
    data.slug = body.slug;
  }
  if (body.description !== undefined) data.description = body.description;
  if (body.isPublished !== undefined) data.isPublished = body.isPublished;
  if (body.password !== undefined) {
    data.password = body.password ? await bcrypt.hash(body.password, 10) : null;
  }

  const updated = await prisma.gallery.update({
    where: { id },
    data,
  });

  return NextResponse.json({ gallery: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const gallery = await prisma.gallery.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  await prisma.gallery.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
