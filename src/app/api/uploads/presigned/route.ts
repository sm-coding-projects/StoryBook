import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/s3";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType, collectionId } = await req.json();

  if (!filename || !contentType || !collectionId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const ext = filename.split(".").pop() || "jpg";
  const key = `uploads/${session.user.id}/${collectionId}/${nanoid()}.${ext}`;

  const { url } = await getPresignedUploadUrl(key, contentType);

  return NextResponse.json({ url, key });
}
