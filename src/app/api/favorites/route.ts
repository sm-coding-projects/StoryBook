import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { photoId } = await req.json();

  if (!photoId) {
    return NextResponse.json({ error: "photoId required" }, { status: 400 });
  }

  const photo = await prisma.photo.update({
    where: { id: photoId },
    data: { isFavorite: true },
  });

  return NextResponse.json({ photo });
}

export async function DELETE(req: NextRequest) {
  const { photoId } = await req.json();

  if (!photoId) {
    return NextResponse.json({ error: "photoId required" }, { status: 400 });
  }

  const photo = await prisma.photo.update({
    where: { id: photoId },
    data: { isFavorite: false },
  });

  return NextResponse.json({ photo });
}
