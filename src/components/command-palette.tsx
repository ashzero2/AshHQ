"use client";

import { useState, useCallback, useEffect } from "react";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useDebounce } from "@/hooks/use-debounce";
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
  FileText,
  NotebookPen,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { logout } from "@/lib/services/auth";
import { searchContent, type SearchResult } from "@/lib/services/search";

const TYPE_ICON: Record<SearchResult["type"], React.ReactNode> = {
  task: <CheckSquare size={14} />,
  note: <StickyNote size={14} />,
  journal: <NotebookPen size={14} />,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const debouncedQuery = useDebounce(query, 300);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => { setOpen(false); setQuery(""); setResults([]); }, []);
  useKeyboardShortcut("k", toggle, { ctrlOrMeta: true });
  useKeyboardShortcut("Escape", close, { preventDefault: false });

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setSearching(true);
    searchContent(debouncedQuery)
      .then(setResults)
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  const navigate = (path: string) => {
    router.push(path);
    close();
  };

  const itemCls =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-muted-fg data-[selected=true]:bg-surface-raised data-[selected=true]:text-foreground transition-colors";

  const showNav = query.length < 2;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <Command
            shouldFilter={false}
            className="relative w-full max-w-lg bg-surface border border-outline rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 border-b border-outline">
              {searching
                ? <Loader2 size={16} className="text-subtle-fg animate-spin flex-shrink-0" />
                : <Search size={16} className="text-subtle-fg flex-shrink-0" />
              }
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search tasks, notes, journal… or type a command"
                className="w-full py-3 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-subtle-fg"
                autoFocus
              />
            </div>
            <Command.List className="max-h-[360px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-fg">
                {debouncedQuery.length >= 2 && !searching ? "No results found." : "Type to search…"}
              </Command.Empty>

              {/* Search results */}
              {results.length > 0 && (
                <Command.Group
                  heading="Results"
                  className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle-fg px-2 py-1.5"
                >
                  {results.map((r) => (
                    <Command.Item
                      key={r.id}
                      value={r.id}
                      onSelect={() => navigate(r.url)}
                      className={itemCls}
                    >
                      <span className="text-subtle-fg flex-shrink-0">{TYPE_ICON[r.type]}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-foreground">{r.title}</span>
                        {r.subtitle && (
                          <span className="block truncate text-[11px] text-subtle-fg">{r.subtitle}</span>
                        )}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Navigation — shown when not actively searching */}
              {showNav && (
                <>
                  <Command.Group
                    heading="Navigation"
                    className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle-fg px-2 py-1.5"
                  >
                    <Command.Item value="dashboard" onSelect={() => navigate("/")} className={itemCls}>
                      <LayoutDashboard size={16} /> Dashboard
                    </Command.Item>
                    <Command.Item value="tasks" onSelect={() => navigate("/tasks")} className={itemCls}>
                      <CheckSquare size={16} /> Tasks
                    </Command.Item>
                    <Command.Item value="calendar" onSelect={() => navigate("/calendar")} className={itemCls}>
                      <CalendarDays size={16} /> Calendar
                    </Command.Item>
                    <Command.Item value="finance" onSelect={() => navigate("/finance")} className={itemCls}>
                      <Wallet size={16} /> Finance
                    </Command.Item>
                    <Command.Item value="habits" onSelect={() => navigate("/habits")} className={itemCls}>
                      <Target size={16} /> Habits
                    </Command.Item>
                    <Command.Item value="notes" onSelect={() => navigate("/notes")} className={itemCls}>
                      <StickyNote size={16} /> Notes
                    </Command.Item>
                    <Command.Item value="links" onSelect={() => navigate("/links")} className={itemCls}>
                      <Link2 size={16} /> Links
                    </Command.Item>
                    <Command.Item value="journal" onSelect={() => navigate("/journal")} className={itemCls}>
                      <BookOpen size={16} /> Journal
                    </Command.Item>
                    <Command.Item value="analytics" onSelect={() => navigate("/analytics")} className={itemCls}>
                      <FileText size={16} /> Analytics
                    </Command.Item>
                    <Command.Item value="settings" onSelect={() => navigate("/settings")} className={itemCls}>
                      <Settings size={16} /> Settings
                    </Command.Item>
                  </Command.Group>

                  <Command.Separator className="my-1 border-t border-outline" />

                  <Command.Group
                    heading="Actions"
                    className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle-fg px-2 py-1.5"
                  >
                    <Command.Item
                      value="toggle-theme"
                      onSelect={() => { setTheme(theme === "dark" ? "light" : "dark"); close(); }}
                      className={itemCls}
                    >
                      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                      Toggle Theme
                    </Command.Item>
                    <Command.Item
                      value="logout"
                      onSelect={async () => { await logout(); close(); router.push("/login"); }}
                      className={itemCls}
                    >
                      <LogOut size={16} /> Logout
                    </Command.Item>
                  </Command.Group>
                </>
              )}
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
