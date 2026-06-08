"use client";

import { CheckSquare } from "lucide-react";

export function TasksWidget() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
      <CheckSquare size={24} className="mb-2" />
      <p className="text-sm">No tasks yet</p>
      <p className="text-xs mt-1">Add tasks to get started</p>
    </div>
  );
}
