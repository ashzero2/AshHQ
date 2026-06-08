"use client";

import { Link2 } from "lucide-react";

export function QuickLinksWidget() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
      <Link2 size={24} className="mb-2" />
      <p className="text-sm">Quick Links</p>
      <p className="text-xs mt-1">Add your bookmarks</p>
    </div>
  );
}
