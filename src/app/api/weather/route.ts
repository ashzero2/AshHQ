import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings?.weatherApiKey || !settings?.weatherCity) {
      return NextResponse.json({ error: "Weather not configured" }, { status: 400 });
    }

    const unit = settings.temperatureUnit === "F" ? "imperial" : "metric";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(settings.weatherCity)}&appid=${settings.weatherApiKey}&units=${unit}`;
    
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch weather" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
      unit: settings.temperatureUnit || "C",
    });
  } catch {
    return NextResponse.json({ error: "Weather service error" }, { status: 500 });
  }
}
