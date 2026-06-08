"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Wallet,
  Target,
  StickyNote,
  Settings,
  Search,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { logout } from "@/lib/services/auth";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <Command className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 border-b border-zinc-800">
              <Search size={16} className="text-zinc-500" />
              <Command.Input
                placeholder="Type a command or search..."
                className="w-full py-3 bg-transparent text-sm focus:outline-none placeholder-zinc-500"
                autoFocus
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                No results found.
              </Command.Empty>

              <Command.Group heading="Navigation" className="text-xs text-zinc-500 px-2 py-1.5">
                <Command.Item onSelect={() => navigate("/")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white">
                  <LayoutDashboard size={16} /> Dashboard
                </Command.Item>
                <Command.Item onSelect={() => navigate("/tasks")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white">
                  <CheckSquare size={16} /> Tasks
                </Command.Item>
                <Command.Item onSelect={() => navigate("/calendar")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white">
                  <CalendarDays size={16} /> Calendar
                </Command.Item>
                <Command.Item onSelect={() => navigate("/finance")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white">
                  <Wallet size={16} /> Finance
                </Command.Item>
                <Command.Item onSelect={() => navigate("/habits")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white">
                  <Target size={16} /> Habits
                </Command.Item>
                <Command.Item onSelect={() => navigate("/notes")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white">
                  <StickyNote size={16} /> Notes
                </Command.Item>
                <Command.Item onSelect={() => navigate("/settings")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white">
                  <Settings size={16} /> Settings
                </Command.Item>
              </Command.Group>

              <Command.Separator className="my-1 border-t border-zinc-800" />

              <Command.Group heading="Actions" className="text-xs text-zinc-500 px-2 py-1.5">
                <Command.Item onSelect={() => { setTheme(theme === "dark" ? "light" : "dark"); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white">
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  Toggle Theme
                </Command.Item>
                <Command.Item onSelect={async () => { await logout(); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white">
                  <LogOut size={16} /> Logout
                </Command.Item>
              </Command.Group>
            </Command.List>
            <div className="border-t border-zinc-800 px-4 py-2 text-xs text-zinc-600 flex gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>esc Close</span>
            </div>
          </Command>
        </div>
      )}
    </>
  );
}
