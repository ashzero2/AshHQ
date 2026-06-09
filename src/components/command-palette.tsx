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
  Link2,
  BookOpen,
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
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const itemCls =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-muted-fg data-[selected=true]:bg-surface-raised data-[selected=true]:text-foreground transition-colors";

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <Command className="relative w-full max-w-lg bg-surface border border-outline rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 border-b border-outline">
              <Search size={16} className="text-subtle-fg" />
              <Command.Input
                placeholder="Type a command or search..."
                className="w-full py-3 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-subtle-fg"
                autoFocus
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-fg">
                No results found.
              </Command.Empty>

              <Command.Group heading="Navigation" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle-fg px-2 py-1.5">
                <Command.Item onSelect={() => navigate("/")} className={itemCls}>
                  <LayoutDashboard size={16} /> Dashboard
                </Command.Item>
                <Command.Item onSelect={() => navigate("/tasks")} className={itemCls}>
                  <CheckSquare size={16} /> Tasks
                </Command.Item>
                <Command.Item onSelect={() => navigate("/calendar")} className={itemCls}>
                  <CalendarDays size={16} /> Calendar
                </Command.Item>
                <Command.Item onSelect={() => navigate("/finance")} className={itemCls}>
                  <Wallet size={16} /> Finance
                </Command.Item>
                <Command.Item onSelect={() => navigate("/habits")} className={itemCls}>
                  <Target size={16} /> Habits
                </Command.Item>
                <Command.Item onSelect={() => navigate("/notes")} className={itemCls}>
                  <StickyNote size={16} /> Notes
                </Command.Item>
                <Command.Item onSelect={() => navigate("/links")} className={itemCls}>
                  <Link2 size={16} /> Links
                </Command.Item>
                <Command.Item onSelect={() => navigate("/journal")} className={itemCls}>
                  <BookOpen size={16} /> Journal
                </Command.Item>
                <Command.Item onSelect={() => navigate("/settings")} className={itemCls}>
                  <Settings size={16} /> Settings
                </Command.Item>
              </Command.Group>

              <Command.Separator className="my-1 border-t border-outline" />

              <Command.Group heading="Actions" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle-fg px-2 py-1.5">
                <Command.Item
                  onSelect={() => { setTheme(theme === "dark" ? "light" : "dark"); setOpen(false); }}
                  className={itemCls}
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  Toggle Theme
                </Command.Item>
                <Command.Item
                  onSelect={async () => { await logout(); setOpen(false); router.push("/login"); }}
                  className={itemCls}
                >
                  <LogOut size={16} /> Logout
                </Command.Item>
              </Command.Group>
            </Command.List>
            <div className="border-t border-outline px-4 py-2 text-[11px] text-subtle-fg flex gap-4">
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
