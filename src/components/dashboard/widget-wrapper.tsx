"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
  title?: string;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function WidgetWrapper({
  title,
  children,
  className,
  noPadding = false,
}: WidgetWrapperProps) {
  return (
    <div
      className={cn(
        "h-full rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-hidden flex flex-col",
        className
      )}
    >
      {title && (
        <div className="px-4 py-2.5 border-b border-zinc-800/50 flex-shrink-0">
          <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
        </div>
      )}
      <div className={cn("flex-1 overflow-auto", !noPadding && "p-4")}>
        {children}
      </div>
    </div>
  );
}
