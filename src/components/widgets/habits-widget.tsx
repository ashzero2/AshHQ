"use client";

import { Target } from "lucide-react";

export function HabitsWidget() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
      <Target size={24} className="mb-2" />
      <p className="text-sm">Habits</p>
      <p className="text-xs mt-1">No habits tracked yet</p>
    </div>
  );
}
