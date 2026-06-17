import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}
