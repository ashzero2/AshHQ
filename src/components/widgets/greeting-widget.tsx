"use client";

import { useState, useEffect } from "react";
import { getGreeting } from "@/lib/utils";
import { MOTIVATIONAL_QUOTES } from "@/lib/constants";

export function GreetingWidget() {
  const [greeting, setGreeting] = useState(getGreeting());
  const [quote, setQuote] = useState("");

  useEffect(() => {
    setQuote(
      MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
    );
    const timer = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col justify-center h-full gap-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle-fg">
        {greeting}
      </p>
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
        Welcome back, <span className="text-accent">Ash</span>
      </h1>
      {quote && (
        <p className="text-sm text-muted-fg leading-relaxed mt-1 font-light italic max-w-md">
          &ldquo;{quote}&rdquo;
        </p>
      )}
    </div>
  );
}
