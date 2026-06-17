"use client";

import { useState } from "react";
import { Download, Loader2, CheckSquare, Square } from "lucide-react";
import { useGalleryStore, type GalleryPhoto } from "@/stores/gallery-store";
import { cn } from "@/lib/utils";

interface BulkDownloadProps {
  photos: GalleryPhoto[];
}

export function BulkDownload({ photos }: BulkDownloadProps) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const { favorites } = useGalleryStore();

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    setSelected(new Set(photos.map((p) => p.id)));
  };

  const selectFavorites = () => {
    setSelected(new Set(favorites));
  };

  const handleBulkDownload = async () => {
    if (selected.size === 0) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/downloads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "photos.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Could show toast
    } finally {
      setDownloading(false);
    }
  };

  if (!selecting) {
    return (
      <button
        onClick={() => setSelecting(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Download
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-neutral-50 rounded-2xl sm:rounded-full px-4 py-2">
      <span className="text-sm text-neutral-600">
        {selected.size} selected
      </span>
      <button
        onClick={selectAll}
        className="text-xs text-neutral-500 hover:text-neutral-700 underline"
      >
        All
      </button>
      {favorites.size > 0 && (
        <button
          onClick={selectFavorites}
          className="text-xs text-neutral-500 hover:text-neutral-700 underline"
        >
          Favorites
        </button>
      )}
      <button
        onClick={handleBulkDownload}
        disabled={selected.size === 0 || downloading}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 text-sm rounded-full transition-colors",
          "bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
        )}
      >
        {downloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        Download
      </button>
      <button
        onClick={() => {
          setSelecting(false);
          setSelected(new Set());
        }}
        className="text-xs text-neutral-400 hover:text-neutral-600"
      >
        Cancel
      </button>
    </div>
  );
}
