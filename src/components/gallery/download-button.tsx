"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  photoId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "icon" | "button";
}

export function DownloadButton({
  photoId,
  size = "md",
  className,
  variant = "icon",
}: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const res = await fetch(`/api/downloads/${photoId}`);
      if (!res.ok) throw new Error("Download failed");
      const data = await res.json();
      const fileRes = await fetch(data.url);
      const blob = await fileRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = data.filename || "photo.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Could show a toast here
    } finally {
      setDownloading(false);
    }
  };

  if (variant === "button") {
    return (
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full",
          "bg-neutral-900 text-white hover:bg-neutral-800 transition-colors",
          "disabled:opacity-50",
          className
        )}
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Download
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={cn("transition-transform disabled:opacity-50", className)}
      aria-label="Download photo"
    >
      {downloading ? (
        <Loader2 className={cn(sizeClasses[size], "animate-spin")} />
      ) : (
        <Download className={sizeClasses[size]} />
      )}
    </button>
  );
}
