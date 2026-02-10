"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface GallerySettings {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  password: string | null;
}

async function fetchGallery(id: string): Promise<GallerySettings> {
  const res = await fetch(`/api/galleries/${id}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.gallery;
}

export default function CollectionSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: gallery, isLoading } = useQuery({
    queryKey: ["gallery", id],
    queryFn: () => fetchGallery(id),
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (gallery) {
      setName(gallery.name);
      setSlug(gallery.slug);
      setDescription(gallery.description ?? "");
      setIsPublished(gallery.isPublished);
    }
  }, [gallery]);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/galleries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery", id] });
      queryClient.invalidateQueries({ queryKey: ["galleries"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Settings saved");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save settings");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/galleries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleries"] });
      toast.success("Collection deleted");
      router.push("/");
    },
    onError: () => {
      toast.error("Failed to delete collection");
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <Link
        href={`/collections/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to collection
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight mb-8">Settings</h1>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/g/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={() => updateMutation.mutate({ name, slug, description })}
              disabled={updateMutation.isPending}
            >
              {saved ? "Saved!" : updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete this collection and all its photos.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Are you sure? This cannot be undone.")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Collection"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Published</Label>
              <p className="text-sm text-muted-foreground">
                Make this gallery accessible via its public link.
              </p>
            </div>
            <Switch
              checked={isPublished}
              onCheckedChange={(checked) => {
                setIsPublished(checked);
                updateMutation.mutate({ isPublished: checked });
              }}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Password protection</Label>
              <p className="text-sm text-muted-foreground">
                Require a password for clients to view the gallery.
              </p>
            </div>
            <div className="flex gap-3">
              <Input
                id="password"
                type="text"
                placeholder="Leave empty to disable"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => updateMutation.mutate({ password: password || null })}
                disabled={updateMutation.isPending}
              >
                Set
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
