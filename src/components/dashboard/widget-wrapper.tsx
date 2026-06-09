"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
  title?: string;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  accent?: boolean;
}

export function WidgetWrapper({
  title,
  children,
  className,
  noPadding = false,
  accent = false,
}: WidgetWrapperProps) {
  return (
    <div
      className={cn(
        "h-full rounded-xl border border-outline bg-surface overflow-hidden flex flex-col",
        "shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.025)]",
        accent && "border-accent/30",
        className
      )}
    >
      {title && (
        <div className="px-4 py-2.5 border-b border-outline/60 flex-shrink-0 flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
            {title}
          </h3>
        </div>
      )}
      <div className={cn("flex-1 overflow-auto min-h-0", !noPadding && "p-4")}>
        {children}
      </div>
    </div>
  );
}
