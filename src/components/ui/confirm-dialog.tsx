"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export function ConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = "Delete",
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => prev?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onCancel}
      />
      <div className="relative bg-surface border border-outline rounded-xl max-w-sm w-full p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-rose/10 border border-rose/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={15} className="text-rose" />
          </div>
          <div>
            <h3 id="confirm-title" className="text-sm font-semibold text-foreground">
              {title}
            </h3>
            {description && (
              <p className="text-[12px] text-muted-fg mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 px-3 py-2 rounded-lg bg-surface-raised hover:bg-elevated text-sm text-muted-fg hover:text-foreground transition-colors border border-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-2 rounded-lg bg-rose hover:bg-rose/80 text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
