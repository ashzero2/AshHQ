"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex h-svh bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-warm/10 border-b border-amber-warm/20 text-[12px] text-amber-warm flex-shrink-0">
            <WifiOff size={12} />
            Offline mode. Sync-dependent actions may wait.
          </div>
        )}
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-5 lg:px-7 lg:py-7">
          <div className="mx-auto w-full max-w-[1480px] animate-ash-fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
