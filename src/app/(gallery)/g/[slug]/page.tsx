import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { GalleryPageClient } from "./client";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const gallery = await prisma.gallery.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!gallery) {
    return { title: "Gallery Not Found | StoryBook" };
  }

  return {
    title: `${gallery.name} | StoryBook`,
    description: gallery.description || `View the ${gallery.name} photo gallery on StoryBook`,
    openGraph: {
      title: `${gallery.name} | StoryBook`,
      description: gallery.description || `View the ${gallery.name} photo gallery on StoryBook`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${gallery.name} | StoryBook`,
      description: gallery.description || `View the ${gallery.name} photo gallery on StoryBook`,
    },
  };
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;
  return <GalleryPageClient slug={slug} />;
}
