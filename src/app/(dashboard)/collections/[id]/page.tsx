"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Upload,
  Settings,
  Share2,
  Trash2,
  Check,
  X,
  Images,
} from "lucide-react";
import { toast } from "sonner";

interface Photo {
  id: string;
  filename: string;
  thumbnailKey: string | null;
  webKey: string | null;
  width: number | null;
  height: number | null;
}

interface Collection {
  id: string;
  name: string;
  photos: Photo[];
}

interface GalleryDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  collections: Collection[];
  createdAt: string;
}

interface UploadItem {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
}

async function fetchGallery(id: string): Promise<GalleryDetail> {
  const res = await fetch(`/api/galleries/${id}`);
  if (!res.ok) throw new Error("Failed to fetch gallery");
  const data = await res.json();
  return data.gallery;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { data: gallery, isLoading } = useQuery({
    queryKey: ["gallery", id],
    queryFn: () => fetchGallery(id),
  });

  const deletePhotosMutation = useMutation({
    mutationFn: async (photoIds: string[]) => {
      const res = await fetch(`/api/galleries/${id}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds }),
      });
      if (!res.ok) throw new Error("Failed to delete photos");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery", id] });
      setSelectedPhotos(new Set());
      toast.success("Photos deleted");
    },
    onError: () => {
      toast.error("Failed to delete photos");
    },
  });

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (fileArray.length === 0) return;

      const collectionId = gallery?.collections[0]?.id;
      if (!collectionId) return;

      const newUploads: UploadItem[] = fileArray.map((file) => ({
        file,
        progress: 0,
        status: "pending" as const,
      }));
      setUploads((prev) => [...prev, ...newUploads]);

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploads((prev) =>
          prev.map((u, idx) =>
            u.file === file ? { ...u, status: "uploading" as const, progress: 0 } : u
          )
        );

        try {
          // Get presigned URL
          const presignRes = await fetch(`/api/uploads/presigned`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              collectionId,
            }),
          });
          if (!presignRes.ok) throw new Error("Presign failed");
          const { url: uploadUrl, key } = await presignRes.json();

          // Upload to S3
          await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          // Confirm upload
          await fetch(`/api/uploads/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, collectionId, filename: file.name }),
          });

          setUploads((prev) =>
            prev.map((u) =>
              u.file === file ? { ...u, status: "done" as const, progress: 100 } : u
            )
          );
        } catch {
          setUploads((prev) =>
            prev.map((u) =>
              u.file === file ? { ...u, status: "error" as const } : u
            )
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ["gallery", id] });
      const doneCount = fileArray.length;
      const errorCount = fileArray.length - uploads.filter((u) => u.status === "done").length;
      toast.success(`${doneCount} photo${doneCount > 1 ? "s" : ""} uploaded`);
    },
    [gallery, id, queryClient]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  const toggleSelect = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const allPhotos = gallery?.collections.flatMap((c) => c.photos) ?? [];
  const activeUploads = uploads.filter((u) => u.status === "uploading" || u.status === "pending");
  const uploadProgress =
    uploads.length > 0
      ? Math.round(
          (uploads.filter((u) => u.status === "done").length / uploads.length) * 100
        )
      : 0;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="p-6 lg:p-8 text-center py-24">
        <p className="text-muted-foreground">Collection not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to collections
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {gallery.name}
              </h1>
              <Badge variant={gallery.isPublished ? "default" : "secondary"}>
                {gallery.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            {gallery.description && (
              <p className="text-muted-foreground text-sm">{gallery.description}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/collections/${id}/share`} className="flex-1 sm:flex-initial">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Share2 className="size-4 mr-2" />
                Share
              </Button>
            </Link>
            <Link href={`/collections/${id}/settings`} className="flex-1 sm:flex-initial">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Settings className="size-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && activeUploads.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">
              Uploading {activeUploads.length} of {uploads.length} photos...
            </p>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setUploads([])}
            >
              <X className="size-3" />
            </Button>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Bulk actions */}
      {selectedPhotos.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-muted/50">
          <span className="text-sm font-medium">
            {selectedPhotos.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deletePhotosMutation.mutate(Array.from(selectedPhotos))}
          >
            <Trash2 className="size-4 mr-1" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPhotos(new Set())}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="w-full max-w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="all" className="shrink-0">All Photos ({allPhotos.length})</TabsTrigger>
          {gallery.collections.map((col) => (
            <TabsTrigger key={col.id} value={col.id} className="shrink-0">
              {col.name} ({col.photos.length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <PhotoGrid
            photos={allPhotos}
            selectedPhotos={selectedPhotos}
            onToggleSelect={toggleSelect}
            isDragging={isDragging}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onUpload={uploadFiles}
          />
        </TabsContent>

        {gallery.collections.map((col) => (
          <TabsContent key={col.id} value={col.id}>
            <PhotoGrid
              photos={col.photos}
              selectedPhotos={selectedPhotos}
              onToggleSelect={toggleSelect}
              isDragging={isDragging}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onUpload={uploadFiles}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function PhotoGrid({
  photos,
  selectedPhotos,
  onToggleSelect,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onUpload,
}: {
  photos: Photo[];
  selectedPhotos: Set<string>;
  onToggleSelect: (id: string) => void;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onUpload: (files: FileList | File[]) => void;
}) {
  if (photos.length === 0) {
    return (
      <div
        className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Upload className="size-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-1">Drop photos here</h3>
        <p className="text-sm text-muted-foreground mb-4">
          or click to browse files
        </p>
        <Button
          variant="outline"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.accept = "image/*";
            input.onchange = () => input.files && onUpload(input.files);
            input.click();
          }}
        >
          <Upload className="size-4 mr-2" />
          Upload Photos
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`space-y-4 ${isDragging ? "ring-2 ring-primary ring-offset-2 rounded-lg" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.accept = "image/*";
            input.onchange = () => input.files && onUpload(input.files);
            input.click();
          }}
        >
          <Upload className="size-4 mr-2" />
          Upload More
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((photo) => {
          const isSelected = selectedPhotos.has(photo.id);
          const thumbnailUrl = photo.thumbnailKey
            ? `/api/photos/${photo.id}/thumbnail`
            : undefined;
          return (
            <div
              key={photo.id}
              className={`group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border-2 transition-all ${
                isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent"
              }`}
              onClick={() => onToggleSelect(photo.id)}
            >
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={photo.filename}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Images className="size-6 text-muted-foreground/50" />
                </div>
              )}
              <div
                className={`absolute top-2 left-2 size-5 rounded-full border-2 flex items-center justify-center transition-opacity ${
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground opacity-100"
                    : "border-white/80 bg-black/20 opacity-0 group-hover:opacity-100"
                }`}
              >
                {isSelected && <Check className="size-3" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
