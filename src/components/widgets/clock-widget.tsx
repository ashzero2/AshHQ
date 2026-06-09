"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      <div className="tabular-nums flex items-baseline gap-1">
        <span className="text-[3.25rem] lg:text-[4rem] font-bold tracking-[-3px] leading-none text-foreground font-mono">
          {format(now, "HH:mm")}
        </span>
        <span className="text-xl text-subtle-fg font-mono font-light leading-none">
          {format(now, "ss")}
        </span>
      </div>
      <p className="text-[11px] text-muted-fg font-medium tracking-wide">
        {format(now, "EEEE, MMMM d, yyyy")}
      </p>
    </div>
  );
}
