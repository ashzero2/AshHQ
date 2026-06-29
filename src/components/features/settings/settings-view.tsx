"use client";

import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { updateSettings } from "@/lib/services/settings";
import { testTelegramConnection } from "@/lib/services/telegram";
import { changePin } from "@/lib/services/auth";
import { toast } from "sonner";
import { Download, Upload, Save } from "lucide-react";
import type { Settings } from "@prisma/client";

interface SettingsViewProps { settings: Settings; }

const inputCls =
  "w-full bg-surface-raised border border-outline rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/60 transition-colors";

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-outline/80 rounded-lg p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-[12px] text-muted-fg mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="text-[11px] font-medium text-muted-fg block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ToggleGroup({ options, value, onChange }: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === opt.key
              ? "bg-accent text-background"
              : "bg-surface-raised text-muted-fg border border-outline hover:text-foreground hover:border-outline-strong"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-outline my-4" />;
}

export function SettingsView({ settings }: SettingsViewProps) {
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();
  const [aiProvider, setAiProvider] = useState(settings.aiProvider);
  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey ?? "");
  const [openaiModel, setOpenaiModel] = useState(settings.openaiModel);
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaBaseUrl);
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaModel);
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey ?? "");
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel);
  const [weatherKey, setWeatherKey] = useState(settings.weatherApiKey ?? "");
  const [weatherCity, setWeatherCity] = useState(settings.weatherCity);
  const [tempUnit, setTempUnit] = useState(settings.temperatureUnit);
  const [tgToken, setTgToken] = useState(settings.telegramBotToken ?? "");
  const [tgChatId, setTgChatId] = useState(settings.telegramChatId ?? "");
  const [tgEnabled, setTgEnabled] = useState(settings.telegramEnabled);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [tgTestStatus, setTgTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [tgTestMessage, setTgTestMessage] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [weatherTestStatus, setWeatherTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [weatherTestMessage, setWeatherTestMessage] = useState("");

  const handleSaveSettings = () => {
    startTransition(async () => {
      try {
        await updateSettings({
          aiProvider: aiProvider as "OPENAI" | "OLLAMA" | "GEMINI",
          openaiApiKey: openaiKey || null,
          openaiModel,
          ollamaBaseUrl: ollamaUrl,
          ollamaModel,
          geminiApiKey: geminiKey || null,
          geminiModel,
          weatherApiKey: weatherKey || null,
          weatherCity,
          temperatureUnit: tempUnit as "C" | "F",
          telegramBotToken: tgToken || null,
          telegramChatId: tgChatId || null,
          telegramEnabled: tgEnabled,
          timezone,
        });
        toast.success("Settings saved");
      } catch { toast.error("Failed to save settings"); }
    });
  };

  const handleTestTelegram = () => {
    if (!tgToken || !tgChatId) return;
    setTgTestStatus("testing");
    setTgTestMessage("");
    testTelegramConnection(tgToken, tgChatId)
      .then(({ success, error }) => {
        if (success) { setTgTestStatus("ok"); setTgTestMessage("Message sent!"); }
        else { setTgTestStatus("error"); setTgTestMessage(error ?? "Failed"); }
      })
      .catch(() => { setTgTestStatus("error"); setTgTestMessage("Network error"); });
  };

  const handleTestWeather = () => {
    setWeatherTestStatus("testing");
    setWeatherTestMessage("");
    fetch("/api/weather")
      .then(async (res) => {
        const json = await res.json();
        if (res.ok) {
          setWeatherTestStatus("ok");
          setWeatherTestMessage(`${json.temp}°${json.unit} in ${json.city} — connected!`);
        } else {
          setWeatherTestStatus("error");
          setWeatherTestMessage(json.detail ?? json.error ?? "Connection failed");
        }
      })
      .catch(() => { setWeatherTestStatus("error"); setWeatherTestMessage("Network error"); });
  };

  const handleChangePin = () => {
    if (!currentPin || !newPin || newPin.length < 4) {
      toast.error("New PIN must be at least 4 characters");
      return;
    }
    startTransition(async () => {
      const success = await changePin(currentPin, newPin);
      if (success) {
        toast.success("PIN changed successfully");
        setCurrentPin(""); setNewPin("");
      } else {
        toast.error("Current PIN is incorrect");
      }
    });
  };

  return (
    <div>
      {/* Save button — top right, always visible */}
      <div className="flex justify-end mb-5">
        <button
          onClick={handleSaveSettings}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-background text-sm font-semibold disabled:bg-surface-raised disabled:text-subtle-fg transition-colors"
        >
          <Save size={13} />
          {isPending ? "Saving…" : "Save Settings"}
        </button>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">

        {/* ── Left column: integrations ── */}
        <div className="space-y-4">

          <Card title="Appearance" description="Theme and regional preferences">
            <Field label="Theme">
              <ToggleGroup
                options={[
                  { key: "dark", label: "Dark" },
                  { key: "light", label: "Light" },
                  { key: "system", label: "System" },
                ]}
                value={theme ?? "dark"}
                onChange={setTheme}
              />
            </Field>
            <Field label="Timezone">
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Asia/Kolkata"
                autoComplete="off"
                className={inputCls}
              />
              <p className="text-[11px] text-subtle-fg mt-1">Used for journal dates and Telegram notifications.</p>
            </Field>
          </Card>

          <Card title="Assistant Provider" description="Configure the model used by Ask AshHQ">
            <Field label="Provider">
              <ToggleGroup
                options={[
                  { key: "OPENAI", label: "OpenAI" },
                  { key: "GEMINI", label: "Gemini" },
                  { key: "OLLAMA", label: "Ollama" },
                ]}
                value={aiProvider}
                onChange={setAiProvider}
              />
            </Field>
            {aiProvider === "OPENAI" && (
              <>
                <Field label="OpenAI API key">
                  <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-…" autoComplete="off" className={inputCls} />
                </Field>
                <Field label="Model">
                  <input type="text" value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)} autoComplete="off" className={inputCls} />
                </Field>
              </>
            )}
            {aiProvider === "GEMINI" && (
              <>
                <Field label="Gemini API key">
                  <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="Get a free key at aistudio.google.com" autoComplete="off" className={inputCls} />
                </Field>
                <Field label="Model">
                  <input type="text" value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} autoComplete="off" className={inputCls} />
                  <p className="text-[11px] text-subtle-fg mt-1">Free: gemini-2.5-flash · gemini-2.5-flash-lite · gemini-2.0-flash-lite</p>
                </Field>
              </>
            )}
            {aiProvider === "OLLAMA" && (
              <>
                <Field label="Ollama Base URL">
                  <input type="text" value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} autoComplete="off" className={inputCls} />
                </Field>
                <Field label="Model">
                  <input type="text" value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} autoComplete="off" className={inputCls} />
                </Field>
              </>
            )}
          </Card>

          <Card title="Weather" description="Show weather data on your dashboard">
            <Field label="OpenWeatherMap API Key">
              <input
                type="password"
                value={weatherKey}
                onChange={(e) => { setWeatherKey(e.target.value); setWeatherTestStatus("idle"); }}
                placeholder="Get a free key at openweathermap.org"
                autoComplete="off"
                className={inputCls}
              />
            </Field>
            <Field label="City">
              <input
                type="text"
                value={weatherCity}
                onChange={(e) => { setWeatherCity(e.target.value); setWeatherTestStatus("idle"); }}
                autoComplete="off"
                className={inputCls}
              />
            </Field>
            <Field label="Temperature Unit">
              <ToggleGroup
                options={[{ key: "C", label: "°C Celsius" }, { key: "F", label: "°F Fahrenheit" }]}
                value={tempUnit}
                onChange={setTempUnit}
              />
            </Field>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={handleTestWeather}
                disabled={weatherTestStatus === "testing" || !weatherKey || !weatherCity}
                className="px-3 py-1.5 rounded-lg bg-surface-raised border border-outline hover:border-outline-strong text-[12px] font-medium text-muted-fg hover:text-foreground disabled:text-subtle-fg disabled:cursor-not-allowed transition-colors"
              >
                {weatherTestStatus === "testing" ? "Testing…" : "Test Connection"}
              </button>
              {weatherTestStatus === "ok" && <span className="text-[12px] text-emerald">{weatherTestMessage}</span>}
              {weatherTestStatus === "error" && <span className="text-[12px] text-rose">{weatherTestMessage}</span>}
            </div>
          </Card>

          <Card title="Telegram" description="Notifications and workspace queries through Telegram">
            <Field label="Bot Token">
              <input
                type="password"
                value={tgToken}
                onChange={(e) => { setTgToken(e.target.value); setTgTestStatus("idle"); }}
                placeholder="Get from @BotFather on Telegram"
                autoComplete="off"
                className={inputCls}
              />
            </Field>
            <Field label="Chat ID">
              <input
                type="text"
                value={tgChatId}
                onChange={(e) => { setTgChatId(e.target.value); setTgTestStatus("idle"); }}
                placeholder="Your Telegram user/chat ID"
                autoComplete="off"
                className={inputCls}
              />
              <p className="text-[11px] text-subtle-fg mt-1">Message @userinfobot on Telegram to get your chat ID.</p>
            </Field>
            <Field label="Enable">
              <ToggleGroup
                options={[{ key: "true", label: "Enabled" }, { key: "false", label: "Disabled" }]}
                value={tgEnabled ? "true" : "false"}
                onChange={(v) => setTgEnabled(v === "true")}
              />
            </Field>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={tgTestStatus === "testing" || !tgToken || !tgChatId}
                className="px-3 py-1.5 rounded-lg bg-surface-raised border border-outline hover:border-outline-strong text-[12px] font-medium text-muted-fg hover:text-foreground disabled:text-subtle-fg disabled:cursor-not-allowed transition-colors"
              >
                {tgTestStatus === "testing" ? "Sending…" : "Test Connection"}
              </button>
              {tgTestStatus === "ok" && <span className="text-[12px] text-emerald">{tgTestMessage}</span>}
              {tgTestStatus === "error" && <span className="text-[12px] text-rose">{tgTestMessage}</span>}
            </div>
          </Card>

        </div>

        {/* ── Right column: security + data ── */}
        <div className="space-y-4">

          <Card title="Change PIN" description="Update your dashboard access PIN">
            <Field label="Current PIN">
              <input
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Enter current PIN"
                autoComplete="current-password"
                className={inputCls}
              />
            </Field>
            <Field label="New PIN">
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Minimum 4 characters"
                autoComplete="new-password"
                className={inputCls}
              />
            </Field>
            <button
              onClick={handleChangePin}
              disabled={isPending || !currentPin || !newPin}
              className="w-full py-2 rounded-lg bg-surface-raised border border-outline hover:border-outline-strong hover:bg-elevated text-sm font-medium text-muted-fg hover:text-foreground disabled:text-subtle-fg disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isPending ? "Changing…" : "Change PIN"}
            </button>
          </Card>

          <Card title="Data Management" description="Export your data or import a backup">
            <div className="flex gap-3">
              <a
                href="/api/export"
                download
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-raised border border-outline hover:border-outline-strong text-[12px] font-medium text-muted-fg hover:text-foreground transition-colors"
              >
                <Download size={13} /> Export backup
              </a>
              <span
                title="Import not yet implemented"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-raised border border-outline text-[12px] font-medium text-subtle-fg cursor-not-allowed opacity-50 select-none"
              >
                <Upload size={13} /> Import backup
              </span>
            </div>
            <p className="text-[11px] text-subtle-fg mt-2">Backup includes tasks, events, habits, notes, finance, and journal entries.</p>

            <Divider />

            {/* Bottom save shortcut inside right card */}
            <button
              onClick={handleSaveSettings}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent hover:bg-accent-light text-background text-sm font-semibold disabled:bg-surface-raised disabled:text-subtle-fg transition-colors"
            >
              <Save size={13} />
              {isPending ? "Saving…" : "Save Settings"}
            </button>
          </Card>

        </div>
      </div>
    </div>
  );
}
