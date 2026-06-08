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
    <div className="flex flex-col justify-center h-full">
      <h1 className="text-2xl lg:text-3xl font-bold">
        {greeting}, <span className="text-blue-400">Ash</span> 👋
      </h1>
      {quote && (
        <p className="text-sm text-zinc-400 mt-2 italic leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
      )}
    </div>
  );
}
