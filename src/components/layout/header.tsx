"use client";

import { Menu } from "lucide-react";
import { useAppStore } from "@/stores/app-store";

export function Header() {
  const { toggleSidebar } = useAppStore();

  return (
    <header className="lg:hidden h-14 border-b border-outline/80 bg-surface/95 flex items-center px-4 sticky top-0 z-30 flex-shrink-0">
      <button
        onClick={toggleSidebar}
        className="text-muted-fg hover:text-foreground p-1.5 -ml-1.5 rounded-md hover:bg-surface-raised transition-colors"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      <div className="ml-3">
        <span className="block text-sm font-semibold text-foreground leading-none">AshHQ</span>
        <span className="block text-[10px] text-subtle-fg mt-0.5">Private OS</span>
      </div>
    </header>
  );
}
