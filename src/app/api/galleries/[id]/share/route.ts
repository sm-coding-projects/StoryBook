import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { email, message } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const gallery = await prisma.gallery.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  // In production, send via Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const galleryUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://storybook.app"}/g/${gallery.slug}`;

      await resend.emails.send({
        from: "StoryBook <noreply@storybook.app>",
        to: email,
        subject: `${session.user.name || "A photographer"} shared a gallery with you`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2>${gallery.name}</h2>
            ${message ? `<p>${message}</p>` : ""}
            <p><a href="${galleryUrl}" style="display: inline-block; padding: 12px 24px; background: #171717; color: white; text-decoration: none; border-radius: 8px;">View Gallery</a></p>
          </div>
        `,
      });
    } catch {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
