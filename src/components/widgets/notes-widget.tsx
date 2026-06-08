"use client";

import { StickyNote } from "lucide-react";

export function NotesWidget() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
      <StickyNote size={24} className="mb-2" />
      <p className="text-sm">Notes</p>
      <p className="text-xs mt-1">No notes yet</p>
    </div>
  );
}
