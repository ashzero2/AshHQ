"use client";

import { useEffect, useState, type ReactNode } from "react";

interface ResponsiveGridProps {
  children: ReactNode;
  columns: number;
}

export function ResponsiveGrid({ children, columns }: ResponsiveGridProps) {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const update = () => setWide(window.innerWidth >= 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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
