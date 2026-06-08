"use client";

import { Menu, LogOut } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { logout } from "@/lib/services/auth";
import { useRouter } from "next/navigation";

export function Header() {
  const { toggleSidebar } = useAppStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <button
        onClick={toggleSidebar}
        className="lg:hidden text-zinc-400 hover:text-white p-2 -ml-2"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <button
        onClick={handleLogout}
        className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
        title="Logout"
      >
        <LogOut size={18} />
      </button>
    </header>
  );
}
