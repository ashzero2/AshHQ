"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export function ClockWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-4xl lg:text-5xl font-bold tabular-nums tracking-tight">
        {format(now, "HH:mm")}
        <span className="text-lg text-zinc-500 ml-1">{format(now, "ss")}</span>
      </p>
      <p className="text-sm text-zinc-400 mt-1">
        {format(now, "EEEE, MMMM d, yyyy")}
      </p>
    </div>
  );
}
