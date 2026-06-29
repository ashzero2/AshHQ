"use client";

import { useEffect, useState, type ReactNode } from "react";

interface WorkbenchLayoutProps {
  main: ReactNode;
  rail: ReactNode;
}

interface WorkbenchGridProps {
  children: ReactNode;
  columns: number;
}

function useIsWide() {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const update = () => setWide(window.innerWidth >= 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return wide;
}

export function WorkbenchLayout({ main, rail }: WorkbenchLayoutProps) {
  const wide = useIsWide();

  return (
    <section
      className="grid gap-4"
      style={{
        gridTemplateColumns: wide ? "minmax(0, 1fr) 320px" : "minmax(0, 1fr)",
      }}
    >
      <div className="min-w-0 space-y-4">{main}</div>
      <aside
        className="grid min-w-0 gap-4 sm:grid-cols-2"
        style={{
          alignContent: "start",
          gridTemplateColumns: wide ? "minmax(0, 1fr)" : undefined,
        }}
      >
        {rail}
      </aside>
    </section>
  );
}

export function WorkbenchGrid({ children, columns }: WorkbenchGridProps) {
  const wide = useIsWide();

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: wide
          ? `repeat(${columns}, minmax(0, 1fr))`
          : "minmax(0, 1fr)",
      }}
    >
      {children}
    </div>
  );
}
