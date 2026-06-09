"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { logout } from "@/lib/services/auth";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/links", label: "Links", icon: Link2 },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
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
          "fixed left-0 top-0 z-50 h-full w-56 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          "bg-[#0d0d12] border-r border-outline",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-outline flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-background"
              style={{ background: "linear-gradient(135deg, #e8c06c 0%, #fb923c 100%)" }}
            >
              A
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">AshHQ</span>
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
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle-fg px-3 pb-2 pt-1">
            Navigation
          </p>
          {navItems.map((item) => {
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
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative",
                  isActive
                    ? "bg-surface text-foreground"
                    : "text-muted-fg hover:text-foreground hover:bg-surface/60"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-accent" />
                )}
                <item.icon
                  size={15}
                  className={isActive ? "text-accent" : "text-muted-fg"}
                />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle-fg px-3 pb-2">
              System
            </p>
            <Link
              href="/settings"
              onClick={() => setSidebarOpen(false)}
              aria-current={pathname === "/settings" ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative",
                pathname === "/settings"
                  ? "bg-surface text-foreground"
                  : "text-muted-fg hover:text-foreground hover:bg-surface/60"
              )}
            >
              {pathname === "/settings" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-accent" />
              )}
              <Settings
                size={15}
                className={pathname === "/settings" ? "text-accent" : "text-muted-fg"}
              />
              Settings
            </Link>
          </div>
        </nav>

        {/* Footer — Logout */}
        <div className="px-2 py-3 border-t border-outline flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-muted-fg hover:text-rose hover:bg-rose/5 transition-all duration-150"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
