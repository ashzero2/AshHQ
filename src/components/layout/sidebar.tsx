"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  Wallet,
  Target,
  StickyNote,
  Link2,
  BookOpen,
  BarChart2,
  Settings,
  X,
  LogOut,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { logout } from "@/lib/services/auth";
import { useRouter } from "next/navigation";

const navGroups = [
  {
    label: "Plan",
    items: [
      { href: "/", label: "Today", icon: Home },
      { href: "/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Track",
    items: [
      { href: "/finance", label: "Finance", icon: Wallet },
      { href: "/habits", label: "Habits", icon: Target },
      { href: "/analytics", label: "Analytics", icon: BarChart2 },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/notes", label: "Notes", icon: StickyNote },
      { href: "/links", label: "Links", icon: Link2 },
      { href: "/journal", label: "Journal", icon: BookOpen },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          "bg-surface/95 border-r border-outline/80",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-outline/70 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 min-w-0" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-md border border-outline-strong bg-elevated flex items-center justify-center text-xs font-semibold text-accent">
              A
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-semibold tracking-tight text-foreground">AshHQ</span>
              <span className="block text-[11px] text-subtle-fg leading-none mt-0.5">Private OS</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            className="lg:hidden text-muted-fg hover:text-foreground transition-colors p-1 rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle-fg px-2 pb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-all duration-150 relative",
                        isActive
                          ? "bg-elevated text-foreground"
                          : "text-muted-fg hover:text-foreground hover:bg-surface-raised"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full bg-accent" />
                      )}
                      <item.icon
                        size={15}
                        className={isActive ? "text-accent" : "text-subtle-fg"}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle-fg px-2 pb-2">
              System
            </p>
            <Link
              href="/settings"
              onClick={() => setSidebarOpen(false)}
              aria-current={pathname === "/settings" ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-all duration-150 relative",
                pathname === "/settings"
                  ? "bg-elevated text-foreground"
                  : "text-muted-fg hover:text-foreground hover:bg-surface-raised"
              )}
            >
              {pathname === "/settings" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full bg-accent" />
              )}
              <Settings
                size={15}
                className={pathname === "/settings" ? "text-accent" : "text-subtle-fg"}
              />
              Settings
            </Link>
          </div>
        </nav>

        {/* Footer — Logout */}
        <div className="px-3 py-3 border-t border-outline/70 flex-shrink-0">
          <div className="mb-2 rounded-md border border-outline/70 bg-background/35 px-3 py-2 text-[11px] text-subtle-fg">
            <span className="text-muted-fg">Command</span>
            <span className="float-right font-mono">⌘K</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium text-muted-fg hover:text-rose hover:bg-rose/10 transition-all duration-150"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
