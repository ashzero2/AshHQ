"use client";

import { Children, isValidElement, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface DashboardGridProps {
  children: ReactNode;
  savedLayout?: LayoutItem[];
}

const DESKTOP_SPANS: Record<string, number> = {
  greeting: 6,
  clock: 3,
  weather: 3,
  tasks: 4,
  calendar: 4,
  habits: 4,
  finance: 4,
  notes: 4,
  "quick-links": 4,
  pomodoro: 4,
  analytics: 4,
};

const TABLET_SPANS: Record<string, number> = {
  greeting: 6,
  clock: 3,
  weather: 3,
  tasks: 3,
  calendar: 3,
  habits: 3,
  finance: 3,
  notes: 3,
  "quick-links": 3,
  pomodoro: 3,
  analytics: 3,
};

function useDashboardColumns() {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setColumns(12);
      else if (window.innerWidth >= 768) setColumns(6);
      else setColumns(1);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return columns;
}

export function DashboardGrid({ children }: DashboardGridProps) {
  const columns = useDashboardColumns();
  const spans = columns === 12 ? DESKTOP_SPANS : columns === 6 ? TABLET_SPANS : {};

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        const rawKey = child.key == null ? "" : String(child.key);
        const key = rawKey.replace(/^\.\$/, "").replace(/^\./, "").replace(/^\$/, "");
        const span = spans[key] ?? columns;
        return (
          <div
            className={cn("min-w-0", `dashboard-item-${key}`)}
            style={{ gridColumn: `span ${Math.min(span, columns)} / span ${Math.min(span, columns)}` }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
