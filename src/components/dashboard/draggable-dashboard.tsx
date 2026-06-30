"use client";

import { useRef, useCallback, type ReactNode } from "react";
import { GridLayout, useContainerWidth, useResponsiveLayout } from "react-grid-layout";
import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import { saveDashboardLayout } from "@/lib/services/settings";
import { WidgetWrapper } from "./widget-wrapper";
import { DEFAULT_DASHBOARD_LAYOUTS, WIDGET_TITLES } from "@/lib/constants";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export interface DashboardWidget {
  id: string;
  node: ReactNode;
}

interface DraggableDashboardProps {
  widgets: DashboardWidget[];
  initialLayouts: ResponsiveLayouts;
}

const BREAKPOINTS = { lg: 1200, md: 768, sm: 0 } as const;
const COLS = { lg: 12, md: 8, sm: 4 } as const;
const MARGIN: [number, number] = [8, 8];

export function DraggableDashboard({ widgets, initialLayouts }: DraggableDashboardProps) {
  const { width, containerRef } = useContainerWidth();

  const startLayouts =
    Object.keys(initialLayouts).length > 0 ? initialLayouts : DEFAULT_DASHBOARD_LAYOUTS;

  const latestRef = useRef<ResponsiveLayouts>(startLayouts);

  const { layout, cols, breakpoint, setLayoutForBreakpoint } = useResponsiveLayout({
    width,
    breakpoints: BREAKPOINTS,
    cols: COLS,
    layouts: startLayouts,
  });

  const persist = useCallback(() => {
    saveDashboardLayout(latestRef.current).catch(() => {});
  }, []);

  return (
    <div ref={containerRef} className="-mx-1">
      <GridLayout
        width={width}
        layout={layout}
        gridConfig={{ cols, rowHeight: 56, margin: MARGIN }}
        dragConfig={{ handle: ".drag-handle" }}
        onLayoutChange={(newLayout: Layout) => {
          latestRef.current = { ...latestRef.current, [breakpoint]: newLayout };
          setLayoutForBreakpoint(breakpoint, newLayout);
        }}
        onDragStop={persist}
        onResizeStop={persist}
      >
        {widgets.map(({ id, node }) => (
          <div key={id} className="overflow-hidden">
            <WidgetWrapper title={WIDGET_TITLES[id]} className="h-full">
              {node}
            </WidgetWrapper>
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
