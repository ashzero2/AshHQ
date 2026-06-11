import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { validateSessionToken } from "@/lib/services/auth";

interface WeatherCache {
  data: Record<string, unknown>;
  expiresAt: number;
}
const cache = new Map<string, WeatherCache>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ashhq-session")?.value ?? "";
  if (!await validateSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.settings.findFirst();
    if (!settings?.weatherApiKey || !settings?.weatherCity) {
      return NextResponse.json({ error: "Weather not configured", code: "no_key" }, { status: 400 });
    }

    const unit = settings.temperatureUnit === "F" ? "imperial" : "metric";
    const cacheKey = `${settings.weatherCity}:${unit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.data);
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(settings.weatherCity)}&appid=${settings.weatherApiKey}&units=${unit}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const owmData = await res.json().catch(() => ({}));
      const owmMessage = (owmData as { message?: string })?.message ?? "Unknown error";
      return NextResponse.json(
        { error: "Failed to fetch weather", code: "api_error", detail: owmMessage, owmStatus: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const payload = {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
      unit: settings.temperatureUnit || "C",
    };
    cache.set(cacheKey, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Weather service error", code: "server_error" }, { status: 500 });
  }
}
