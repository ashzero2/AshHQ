"use client";

import { Menu } from "lucide-react";
import { useAppStore } from "@/stores/app-store";

export function Header() {
  const { toggleSidebar } = useAppStore();

  return (
    <header className="lg:hidden h-12 border-b border-outline bg-background/90 backdrop-blur-md flex items-center px-4 sticky top-0 z-30 flex-shrink-0">
      <button
        onClick={toggleSidebar}
        className="text-muted-fg hover:text-foreground p-1.5 -ml-1.5 rounded-lg hover:bg-surface transition-colors"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      <span className="ml-3 text-sm font-semibold text-foreground">AshHQ</span>
    </header>
  );
}
