"use client";

import { useState, useCallback, useRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import type { LayoutItem } from "react-grid-layout/legacy";
import { saveDashboardLayout } from "@/lib/services/settings";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export type { LayoutItem };

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  children: React.ReactNode;
  savedLayout: LayoutItem[];
}

const BREAKPOINTS = { lg: 1200, md: 768, sm: 0 };
const COLS = { lg: 12, md: 6, sm: 2 };

type Layouts = { lg: LayoutItem[]; md: LayoutItem[]; sm: LayoutItem[] };

export function DashboardGrid({ children, savedLayout }: DashboardGridProps) {
  const [layouts, setLayouts] = useState<Layouts>({
    lg: savedLayout,
    md: savedLayout.map((item) => ({
      ...item,
      x: item.x % 6,
      w: Math.min(item.w, 6),
    })),
    sm: savedLayout.map((item) => ({ ...item, x: 0, w: 2 })),
  });

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLayoutChange = useCallback(
    (_layout: readonly LayoutItem[], allLayouts: Partial<Record<string, readonly LayoutItem[]>>) => {
      const lg = allLayouts.lg;
      if (lg) {
        const lgMutable = [...lg] as LayoutItem[];
        setLayouts((prev) => ({ ...prev, lg: lgMutable }));
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          saveDashboardLayout(lgMutable).catch(() => {});
        }, 800);
      }
    },
    []
  );

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={120}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      draggableHandle=".drag-handle"
      isDraggable
      isResizable
      resizeHandles={["se"]}
      onLayoutChange={handleLayoutChange}
    >
      {children}
    </ResponsiveGridLayout>
  );
}
