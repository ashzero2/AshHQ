"use client";

import { CloudSun } from "lucide-react";

export function WeatherWidget() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
      <CloudSun size={24} className="mb-2" />
      <p className="text-sm">Weather</p>
      <p className="text-xs mt-1">Configure API key in settings</p>
    </div>
  );
}
