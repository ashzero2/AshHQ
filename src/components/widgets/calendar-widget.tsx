"use client";

import { CalendarDays } from "lucide-react";

export function CalendarWidget() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
      <CalendarDays size={24} className="mb-2" />
      <p className="text-sm">Calendar</p>
      <p className="text-xs mt-1">No events today</p>
    </div>
  );
}
