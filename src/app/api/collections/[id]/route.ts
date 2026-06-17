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

  const collection = await prisma.collection.findFirst({
    where: { id, gallery: { userId: session.user.id } },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ collection });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  const collection = await prisma.collection.findFirst({
    where: { id, gallery: { userId: session.user.id } },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.collection.update({
    where: { id },
    data: { name: data.name, sortOrder: data.sortOrder },
  });

  return NextResponse.json({ collection: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collection = await prisma.collection.findFirst({
    where: { id, gallery: { userId: session.user.id } },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 }
    );
  }

  await prisma.collection.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
