"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { upsertJournalEntry, deleteJournalEntry } from "@/lib/services/journal";
import { BookOpen, Trash2 } from "lucide-react";

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface JournalViewProps {
  entries: JournalEntry[];
  todayDate: string;
}

const MOODS = [
  { key: "GREAT", emoji: "😄", label: "Great" },
  { key: "GOOD", emoji: "🙂", label: "Good" },
  { key: "OKAY", emoji: "😐", label: "Okay" },
  { key: "BAD", emoji: "😔", label: "Bad" },
  { key: "TERRIBLE", emoji: "😟", label: "Terrible" },
] as const;

function moodEmoji(mood: string | null) {
  return MOODS.find((m) => m.key === mood)?.emoji ?? null;
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function JournalView({ entries: initialEntries, todayDate }: JournalViewProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const current = entries.find((e) => e.date === selectedDate);
  const [content, setContent] = useState(current?.content ?? "");
  const [mood, setMood] = useState<string | null>(current?.mood ?? null);

  useEffect(() => {
    const e = entries.find((en) => en.date === selectedDate);
    setContent(e?.content ?? "");
    setMood(e?.mood ?? null);
    setSaveStatus("idle");
  }, [selectedDate, entries]);

  const save = useCallback(
    (c: string, m: string | null) => {
      setSaveStatus("saving");
      startTransition(async () => {
        try {
          const updated = await upsertJournalEntry({ date: selectedDate, content: c, mood: m });
          setEntries((prev) => {
            const idx = prev.findIndex((e) => e.date === selectedDate);
            const cast = updated as unknown as JournalEntry;
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = cast;
              return next;
            }
            return [cast, ...prev];
          });
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          toast.error("Failed to save");
          setSaveStatus("idle");
        }
      });
    },
    [selectedDate]
  );

  useEffect(() => {
    if (saveStatus === "saving") return;
    const t = setTimeout(() => save(content, mood), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, mood]);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteJournalEntry(id);
        const deleted = entries.find((e) => e.id === id);
        setEntries((prev) => prev.filter((e) => e.id !== id));
        setConfirmDelete(null);
        if (deleted?.date === selectedDate) setSelectedDate(todayDate);
        toast.success("Entry deleted");
      } catch {
        toast.error("Failed to delete");
      }
    });
  };

  const allDates = Array.from(
    new Set([todayDate, ...entries.map((e) => e.date)])
  ).sort((a, b) => b.localeCompare(a));

  const todayFormatted = format(parseISO(todayDate), "EEEE");
  const todayDay = format(parseISO(todayDate), "d");
  const todayMonthYear = format(parseISO(todayDate), "MMMM yyyy");

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 min-h-0">
      {/* Entries sidebar */}
      <div className="lg:w-60 flex-shrink-0 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <BookOpen size={13} className="text-subtle-fg" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
            Entries
          </span>
          <span className="ml-auto text-[10px] text-subtle-fg">{entries.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0 pr-0.5">
          {allDates.map((date) => {
            const entry = entries.find((e) => e.date === date);
            const isToday = date === todayDate;
            const isSelected = date === selectedDate;
            const firstLine = entry?.content?.split("\n")[0]?.trim() ?? "";

            return (
              <div
                key={date}
                className={`group relative rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-surface border-outline-strong shadow-[0_0_0_1px_rgba(232,192,108,0.12)]"
                    : "bg-transparent border-transparent hover:bg-surface hover:border-outline"
                }`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-[11px] font-semibold ${
                        isToday ? "text-accent" : "text-muted-fg"
                      }`}
                    >
                      {isToday ? "Today" : format(parseISO(date), "MMM d")}
                    </span>
                    {entry?.mood && (
                      <span className="text-[11px] leading-none">{moodEmoji(entry.mood)}</span>
                    )}
                    {isSelected && isToday && saveStatus !== "idle" && (
                      <span
                        className={`ml-auto text-[9px] font-medium ${
                          saveStatus === "saved" ? "text-emerald" : "text-subtle-fg"
                        }`}
                      >
                        {saveStatus === "saving" ? "saving…" : "saved"}
                      </span>
                    )}
                  </div>
                  {firstLine ? (
                    <p className="text-[11px] text-subtle-fg truncate leading-snug">{firstLine}</p>
                  ) : (
                    <p className="text-[11px] text-subtle-fg/50 italic">Empty</p>
                  )}
                </div>

                {entry && !isToday && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {confirmDelete === entry.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-rose/20 text-rose hover:bg-rose/30 transition-colors"
                        >
                          Del
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised text-muted-fg hover:text-foreground transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(entry.id); }}
                        className="p-1 rounded-lg text-subtle-fg hover:text-rose hover:bg-rose/10 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vertical divider */}
      <div className="hidden lg:block w-px bg-outline flex-shrink-0" />

      {/* Editor */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Date header */}
        <div className="flex items-end gap-4 mb-5 flex-shrink-0">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_4px_16px_rgba(232,192,108,0.12)]"
            style={{
              background: "linear-gradient(135deg, rgba(232,192,108,0.12) 0%, rgba(251,146,60,0.06) 100%)",
              border: "1px solid rgba(232,192,108,0.18)",
            }}
          >
            <span className="text-2xl font-bold text-accent leading-none font-mono">
              {selectedDate === todayDate ? todayDay : format(parseISO(selectedDate), "d")}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-medium text-subtle-fg uppercase tracking-[0.12em]">
              {selectedDate === todayDate ? todayFormatted : format(parseISO(selectedDate), "EEEE")}
            </p>
            <p className="text-lg font-bold text-foreground tracking-tight leading-tight">
              {selectedDate === todayDate ? todayMonthYear : format(parseISO(selectedDate), "MMMM yyyy")}
            </p>
          </div>
          {selectedDate !== todayDate && (
            <button
              onClick={() => setSelectedDate(todayDate)}
              className="ml-auto text-[11px] px-3 py-1.5 rounded-lg bg-surface-raised border border-outline text-muted-fg hover:text-foreground hover:border-outline-strong transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Mood selector */}
        <div className="flex items-center gap-1.5 mb-4 flex-shrink-0 flex-wrap">
          <span className="text-[11px] text-subtle-fg mr-1">Mood</span>
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMood(mood === m.key ? null : m.key)}
              title={m.label}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm transition-all ${
                mood === m.key
                  ? "bg-accent/15 border border-accent/35 shadow-[0_0_8px_rgba(232,192,108,0.12)]"
                  : "bg-surface-raised border border-outline hover:border-outline-strong"
              }`}
            >
              <span className="leading-none">{m.emoji}</span>
              <span
                className={`text-[11px] font-medium hidden sm:block ${
                  mood === m.key ? "text-accent" : "text-subtle-fg"
                }`}
              >
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="flex-1 flex flex-col min-h-0">
          {entries.length === 0 && !content ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-outline rounded-xl">
              <span className="text-3xl">📓</span>
              <div>
                <p className="text-sm font-medium text-foreground">Start your first journal entry</p>
                <p className="text-[12px] text-muted-fg mt-1">Write anything — thoughts, plans, reflections</p>
              </div>
              <button
                onClick={() => {
                  const el = document.querySelector("textarea");
                  el?.focus();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-light text-background text-[12px] font-semibold transition-colors"
              >
                Write now
              </button>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                selectedDate === todayDate
                  ? "What's on your mind today? Reflect, plan, or just write…"
                  : "No content for this entry."
              }
              className="flex-1 w-full bg-surface border border-outline rounded-xl px-4 py-4 text-sm text-foreground placeholder:text-subtle-fg/60 focus:outline-none focus:border-accent/40 transition-colors resize-none leading-relaxed min-h-[180px]"
            />
          )}
          <div className="flex items-center justify-between mt-2 flex-shrink-0">
            <span className="text-[11px] text-subtle-fg">
              {wordCount(content)} word{wordCount(content) !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-3">
              {saveStatus !== "idle" && (
                <span
                  className={`text-[11px] ${
                    saveStatus === "saved" ? "text-emerald" : "text-subtle-fg"
                  }`}
                >
                  {saveStatus === "saving" ? "Saving…" : "✓ Saved"}
                </span>
              )}
              <button
                onClick={() => save(content, mood)}
                disabled={isPending}
                className="px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-light text-background text-[12px] font-semibold disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
