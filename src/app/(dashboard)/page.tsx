"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Images, Calendar } from "lucide-react";

interface Gallery {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  coverPhotoUrl: string | null;
  _count: { collections: number; photos: number };
  createdAt: string;
}

async function fetchGalleries(): Promise<Gallery[]> {
  const res = await fetch("/api/galleries");
  if (!res.ok) throw new Error("Failed to fetch galleries");
  const data = await res.json();
  return data.galleries;
}

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const { data: galleries = [], isLoading } = useQuery({
    queryKey: ["galleries"],
    queryFn: fetchGalleries,
  });

  const filtered = galleries.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your photo galleries
          </p>
        </div>
        <Link href="/collections/new">
          <Button>
            <Plus className="size-4 mr-2" />
            New Collection
          </Button>
        </Link>
      </div>

      {galleries.length > 0 && (
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && galleries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-6 mb-6">
            <Images className="size-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No collections yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create your first collection to start uploading photos and sharing with clients.
          </p>
          <Link href="/collections/new">
            <Button>
              <Plus className="size-4 mr-2" />
              Create Collection
            </Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No collections matching &quot;{search}&quot;
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((gallery) => (
            <Link
              key={gallery.id}
              href={`/collections/${gallery.id}`}
              className="group rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="aspect-[4/3] bg-muted relative">
                {gallery.coverPhotoUrl ? (
                  <img
                    src={gallery.coverPhotoUrl}
                    alt={gallery.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Images className="size-10 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                    {gallery.name}
                  </h3>
                  <Badge variant={gallery.isPublished ? "default" : "secondary"}>
                    {gallery.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{gallery._count?.photos ?? 0} photos</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {new Date(gallery.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
