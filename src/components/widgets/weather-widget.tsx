"use client";

import { useEffect, useState, useCallback } from "react";
import { Cloud, Droplets, Thermometer, Settings, RefreshCw, AlertTriangle } from "lucide-react";
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

interface WeatherError {
  code: "no_key" | "api_error" | "server_error";
  detail?: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<WeatherError | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/weather")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setError({ code: json.code ?? "server_error", detail: json.detail });
        } else {
          setWeather(json);
        }
      })
      .catch(() => setError({ code: "server_error" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-subtle-fg">
        <div className="w-5 h-5 border-2 border-outline border-t-accent rounded-full animate-spin" />
        <p className="text-[11px] text-muted-fg">Loading weather...</p>
      </div>
    );
  }

  if (error) {
    if (error.code === "no_key") {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-subtle-fg">
          <div className="w-10 h-10 rounded-xl bg-surface-raised border border-outline flex items-center justify-center">
            <Cloud size={18} className="text-muted-fg" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-fg font-medium">Weather not configured</p>
            <Link
              href="/settings"
              className="text-[11px] text-accent hover:text-accent-light transition-colors mt-0.5 inline-flex items-center gap-1"
            >
              <Settings size={10} /> Add API key in settings
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-subtle-fg">
        <div className="w-10 h-10 rounded-xl bg-rose/10 border border-rose/20 flex items-center justify-center">
          <AlertTriangle size={16} className="text-rose" />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-fg font-medium">Weather unavailable</p>
          {error.detail && (
            <p className="text-[11px] text-subtle-fg mt-0.5 max-w-[140px] leading-tight">{error.detail}</p>
          )}
          {!error.detail && error.code === "api_error" && (
            <p className="text-[11px] text-subtle-fg mt-0.5 leading-tight">
              Key may not be activated yet
            </p>
          )}
          <button
            onClick={fetchWeather}
            className="text-[11px] text-accent hover:text-accent-light transition-colors mt-1.5 inline-flex items-center gap-1"
          >
            <RefreshCw size={10} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="flex flex-col h-full justify-center gap-5">
      <div className="flex items-center gap-3">
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          className="w-20 h-20 -ml-3 drop-shadow-sm flex-shrink-0"
        />
        <div>
          <p className="text-5xl font-bold tracking-tight text-foreground tabular-nums leading-none">
            {weather.temp}°{weather.unit}
          </p>
          <p className="text-sm text-muted-fg capitalize mt-1.5">{weather.description}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex gap-5 text-[12px] text-muted-fg">
          <span className="flex items-center gap-1.5">
            <Thermometer size={12} className="text-accent" />
            Feels {weather.feelsLike}°
          </span>
          <span className="flex items-center gap-1.5">
            <Droplets size={12} className="text-sky" />
            {weather.humidity}% humidity
          </span>
        </div>
        <p className="text-[12px] text-subtle-fg font-medium">{weather.city}</p>
      </div>
    </div>
  );
}
