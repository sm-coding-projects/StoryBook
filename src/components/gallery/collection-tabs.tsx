"use client";

import { cn } from "@/lib/utils";

interface CollectionTabsProps {
  collections: { id: string; name: string; photoCount: number }[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function CollectionTabs({
  collections,
  activeId,
  onSelect,
}: CollectionTabsProps) {
  if (collections.length <= 1) return null;

  const totalPhotos = collections.reduce((sum, c) => sum + c.photoCount, 0);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
          activeId === null
            ? "bg-neutral-900 text-white"
            : "text-neutral-600 hover:bg-neutral-100"
        )}
      >
        All ({totalPhotos})
      </button>
      {collections.map((col) => (
        <button
          key={col.id}
          onClick={() => onSelect(col.id)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
            activeId === col.id
              ? "bg-neutral-900 text-white"
              : "text-neutral-600 hover:bg-neutral-100"
          )}
        >
          {col.name} ({col.photoCount})
        </button>
      ))}
    </div>
  );
}
