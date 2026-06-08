"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/lib/services/settings";
import { changePin } from "@/lib/services/auth";
import { toast } from "sonner";
import type { Settings } from "@prisma/client";

interface SettingsViewProps { settings: Settings; }

export function SettingsView({ settings }: SettingsViewProps) {
  const [isPending, startTransition] = useTransition();
  const [aiProvider, setAiProvider] = useState(settings.aiProvider);
  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey ?? "");
  const [openaiModel, setOpenaiModel] = useState(settings.openaiModel);
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaBaseUrl);
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaModel);
  const [weatherKey, setWeatherKey] = useState(settings.weatherApiKey ?? "");
  const [weatherCity, setWeatherCity] = useState(settings.weatherCity);
  const [tempUnit, setTempUnit] = useState(settings.temperatureUnit);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const handleSaveSettings = () => {
    startTransition(async () => {
      try {
        await updateSettings({
          aiProvider: aiProvider as "OPENAI" | "OLLAMA",
          openaiApiKey: openaiKey || null,
          openaiModel,
          ollamaBaseUrl: ollamaUrl,
          ollamaModel,
          weatherApiKey: weatherKey || null,
          weatherCity,
          temperatureUnit: tempUnit as "C" | "F",
        });
        toast.success("Settings saved");
      } catch { toast.error("Failed to save settings"); }
    });
  };

  const handleChangePin = () => {
    if (!currentPin || !newPin || newPin.length < 4) {
      toast.error("PIN must be at least 4 characters");
      return;
    }
    startTransition(async () => {
      const success = await changePin(currentPin, newPin);
      if (success) { toast.success("PIN changed"); setCurrentPin(""); setNewPin(""); }
      else { toast.error("Current PIN is incorrect"); }
    });
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="mb-3 last:mb-0"><label className="text-xs text-zinc-500 block mb-1">{label}</label>{children}</div>
  );

  const inputClass = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500";

  return (
    <div>
      <Section title="🤖 AI Provider">
        <div className="flex gap-2 mb-3">
          {(["OPENAI", "OLLAMA"] as const).map((p) => (
            <button key={p} onClick={() => setAiProvider(p)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${aiProvider === p ? "bg-blue-600" : "bg-zinc-800 text-zinc-400"}`}>{p === "OPENAI" ? "OpenAI" : "Ollama (Local)"}</button>
          ))}
        </div>
        {aiProvider === "OPENAI" ? (
          <>
            <Field label="OpenAI API Key"><input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-..." className={inputClass} /></Field>
            <Field label="Model"><input type="text" value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)} className={inputClass} /></Field>
          </>
        ) : (
          <>
            <Field label="Ollama Base URL"><input type="text" value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} className={inputClass} /></Field>
            <Field label="Model"><input type="text" value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} className={inputClass} /></Field>
          </>
        )}
      </Section>

      <Section title="🌤️ Weather">
        <Field label="OpenWeatherMap API Key"><input type="password" value={weatherKey} onChange={(e) => setWeatherKey(e.target.value)} placeholder="Get free key at openweathermap.org" className={inputClass} /></Field>
        <Field label="City"><input type="text" value={weatherCity} onChange={(e) => setWeatherCity(e.target.value)} className={inputClass} /></Field>
        <Field label="Temperature Unit">
          <div className="flex gap-2">
            {(["C", "F"] as const).map((u) => (
              <button key={u} onClick={() => setTempUnit(u)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tempUnit === u ? "bg-blue-600" : "bg-zinc-800 text-zinc-400"}`}>°{u}</button>
            ))}
          </div>
        </Field>
      </Section>

      <button onClick={handleSaveSettings} disabled={isPending} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-sm font-medium transition-colors mb-6">
        {isPending ? "Saving..." : "Save Settings"}
      </button>

      <Section title="🔒 Change PIN">
        <Field label="Current PIN"><input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} placeholder="Enter current PIN" className={inputClass} /></Field>
        <Field label="New PIN"><input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="Enter new PIN (min 4 chars)" className={inputClass} /></Field>
        <button onClick={handleChangePin} disabled={isPending || !currentPin || !newPin} className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:text-zinc-600 text-sm font-medium transition-colors mt-2">
          {isPending ? "Changing..." : "Change PIN"}
        </button>
      </Section>
    </div>
  );
}
