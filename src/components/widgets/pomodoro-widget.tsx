"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { createFocusSession } from "@/lib/services/pomodoro";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

type Mode = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

const DURATIONS: Record<Mode, number> = {
  WORK: 25 * 60,
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,
};

const MODE_LABELS: Record<Mode, string> = {
  WORK: "Focus",
  SHORT_BREAK: "Short break",
  LONG_BREAK: "Long break",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function PomodoroWidget() {
  const [mode, setMode] = useState<Mode>("WORK");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.WORK);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [, startTransition] = useTransition();
  // endAt tracks the absolute timestamp when the current countdown finishes
  const endAtRef = useRef<number | null>(null);

  const total = DURATIONS[mode];
  const pct = ((total - timeLeft) / total) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const switchMode = (m: Mode) => {
    endAtRef.current = null;
    setMode(m);
    setTimeLeft(DURATIONS[m]);
    setRunning(false);
  };

  const reset = () => {
    endAtRef.current = null;
    setRunning(false);
    setTimeLeft(DURATIONS[mode]);
  };

  const toggleRunning = () => {
    if (running) {
      endAtRef.current = null;
      setRunning(false);
    } else {
      endAtRef.current = Date.now() + timeLeft * 1000;
      setRunning(true);
    }
  };

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      if (endAtRef.current === null) return;
      const remaining = Math.ceil((endAtRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        setTimeLeft(0);
        setRunning(false);
        endAtRef.current = null;
        if (mode === "WORK") {
          setSessions((s) => s + 1);
          startTransition(async () => {
            await createFocusSession({ duration: Math.round(DURATIONS.WORK / 60), type: "WORK" });
          });
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [running, mode]);

  const r = 38;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (pct / 100) * circumference;
  const ringColor = mode === "WORK" ? "#e8c06c" : mode === "SHORT_BREAK" ? "#4ade80" : "#7dd3fc";

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      {/* Mode switcher */}
      <div className="flex gap-1">
        {(["WORK", "SHORT_BREAK", "LONG_BREAK"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              mode === m
                ? "text-background"
                : "bg-surface-raised border border-outline text-subtle-fg hover:text-muted-fg"
            }`}
            style={mode === m ? { background: ringColor } : {}}
          >
            {m === "WORK" ? "Focus" : m === "SHORT_BREAK" ? "Break" : "Long"}
          </button>
        ))}
      </div>

      {/* Ring timer */}
      <div className="relative flex items-center justify-center">
        <svg width="100" height="100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface-raised)" strokeWidth="5" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums text-foreground font-mono leading-none">
            {pad(mins)}:{pad(secs)}
          </span>
          <span className="text-[9px] text-subtle-fg mt-0.5">{MODE_LABELS[mode]}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          aria-label="Reset timer"
          className="p-2 rounded-lg text-subtle-fg hover:text-muted-fg hover:bg-surface-raised transition-all"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={toggleRunning}
          aria-label={running ? "Pause timer" : "Start timer"}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-background transition-all hover:opacity-90"
          style={{ background: ringColor }}
        >
          {running ? <Pause size={12} /> : <Play size={12} />}
          {running ? "Pause" : "Start"}
        </button>
        {mode === "WORK" && (
          <button
            onClick={() => switchMode("SHORT_BREAK")}
            aria-label="Take a short break"
            className="p-2 rounded-lg text-subtle-fg hover:text-emerald hover:bg-emerald/10 transition-all"
          >
            <Coffee size={13} />
          </button>
        )}
      </div>

      {/* Session count */}
      {sessions > 0 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: i % 4 === 3 ? "#4ade80" : "#e8c06c" }}
            />
          ))}
          {sessions > 8 && <span className="text-[10px] text-subtle-fg">+{sessions - 8}</span>}
        </div>
      )}
    </div>
  );
}
