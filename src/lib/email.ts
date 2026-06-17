export async function sendGalleryShareEmail({
  to,
  galleryName,
  galleryUrl,
  photographerName,
  message,
}: {
  to: string;
  galleryName: string;
  galleryUrl: string;
  photographerName: string;
  message?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "StoryBook <noreply@storybook.app>",
    to,
    subject: `${photographerName} shared a gallery with you: ${galleryName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${photographerName} shared a gallery with you</h2>
        <p>You&apos;ve been invited to view <strong>${galleryName}</strong>.</p>
        ${message ? `<p>&quot;${message}&quot;</p>` : ""}
        <a href="${galleryUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
          View Gallery
        </a>
      </div>
    `,
  });
}
