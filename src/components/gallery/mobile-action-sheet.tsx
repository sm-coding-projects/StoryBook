"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function MobileActionSheet({
  open,
  onClose,
  title,
  children,
}: MobileActionSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 sm:hidden"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 sm:hidden",
          "bg-white rounded-t-2xl shadow-xl",
          "animate-[slideUp_0.3s_ease-out]"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-300" />
        </div>

        {title && (
          <div className="flex items-center justify-between gap-2 px-4 py-2">
            <h3 className="min-w-0 truncate text-base font-medium">{title}</h3>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-full hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="px-4 pb-8 pt-2 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
