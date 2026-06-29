"use client";

import { useState, useEffect } from "react";
import { getGreeting } from "@/lib/utils";

export function GreetingWidget() {
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const timer = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle-fg">
        {greeting}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
        Ash&apos;s workspace
      </h1>
      <p className="max-w-md text-sm leading-6 text-muted-fg">
        Use the panels to plan the day, keep routines current, and review what changed.
      </p>
    </div>
  );
}
