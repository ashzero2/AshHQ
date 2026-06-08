"use client";

import { useEffect, useState } from "react";
import { CloudSun, Droplets, Thermometer, Wind } from "lucide-react";
import Link from "next/link";

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  city: string;
  unit: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/weather")
      .then((res) => {
        if (!res.ok) throw new Error("Not configured");
        return res.json();
      })
      .then(setWeather)
      .catch(() => setError("not_configured"));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <CloudSun size={24} className="mb-2" />
        <p className="text-sm">Weather</p>
        <Link href="/settings" className="text-blue-400 text-xs mt-1 hover:underline">
          Configure API key in settings
        </Link>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <div className="w-6 h-6 border-2 border-zinc-600 border-t-blue-400 rounded-full animate-spin mb-2" />
        <p className="text-xs">Loading weather...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex items-center gap-3">
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          className="w-14 h-14 -ml-2"
        />
        <div>
          <p className="text-3xl font-bold">
            {weather.temp}°{weather.unit}
          </p>
          <p className="text-sm text-zinc-400 capitalize">{weather.description}</p>
        </div>
      </div>
      <div className="flex gap-4 text-xs text-zinc-400 mt-2">
        <span className="flex items-center gap-1">
          <Thermometer size={12} /> Feels {weather.feelsLike}°
        </span>
        <span className="flex items-center gap-1">
          <Droplets size={12} /> {weather.humidity}%
        </span>
      </div>
      <p className="text-xs text-zinc-500 mt-1">{weather.city}</p>
    </div>
  );
}
