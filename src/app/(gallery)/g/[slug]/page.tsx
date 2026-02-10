import { GalleryPageClient } from "./client";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <GalleryPageClient slug={slug} />;
}
