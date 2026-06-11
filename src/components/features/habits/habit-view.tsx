"use client";

import { useState, useTransition } from "react";
import { createHabit, deleteHabit, toggleHabitLog } from "@/lib/services/habits";
import { Plus, Trash2, Target, Flame, Trophy, CheckCircle2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface HabitWithStreak {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  currentStreak: number;
  longestStreak: number;
  todayStr: string;
  logs: { date: string; completed: boolean }[];
}

interface HabitViewProps {
  habits: HabitWithStreak[];
}

function WeekStrip({ logs }: { logs: { date: string; completed: boolean }[] }) {
  const completedSet = new Set(
    logs.filter((l) => l.completed).map((l) => l.date)
  );
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      dateStr: format(d, "yyyy-MM-dd"),
      dayLabel: format(d, "EEEEE"), // single char like M, T, W...
      isToday: i === 6,
    };
  });

  return (
    <div className="flex gap-1.5 mt-3">
      {last7.map(({ dateStr, dayLabel, isToday }) => {
        const done = completedSet.has(dateStr);
        return (
          <div key={dateStr} className="flex flex-col items-center gap-1">
            <span className={cn("text-[9px] font-medium", isToday ? "text-accent" : "text-subtle-fg")}>
              {dayLabel}
            </span>
            <div
              className={cn(
                "w-5 h-5 rounded-md border transition-colors",
                done
                  ? "bg-emerald/70 border-emerald/40"
                  : isToday
                  ? "border-accent/30 bg-accent/5"
                  : "bg-surface-raised border-outline"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

export function HabitView({ habits }: HabitViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✅");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Use the timezone-aware date computed server-side so streak and toggle agree
  const today = habits[0]?.todayStr ?? format(new Date(), "yyyy-MM-dd");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await createHabit({ name: name.trim(), icon, color: "#4ade80", frequency: "DAILY" });
        toast.success("Habit created");
        setName(""); setIcon("✅"); setShowForm(false);
      } catch { toast.error("Failed to create habit"); }
    });
  };

  const handleToggle = (habitId: string) => {
    startTransition(async () => {
      await toggleHabitLog(habitId, today);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteHabit(id);
      toast.success("Habit deleted");
    });
  };

  const completedToday = habits.filter((h) =>
    h.logs.some((l) => l.date === today && l.completed)
  ).length;

  const inputCls =
    "bg-surface-raised border border-outline rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/60 transition-colors";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {habits.length > 0 && (
            <>
              <span className="text-sm text-muted-fg">
                <span className="text-emerald font-semibold">{completedToday}</span>
                <span className="text-subtle-fg"> / {habits.length} today</span>
              </span>
              {completedToday === habits.length && habits.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-emerald">
                  <CheckCircle2 size={12} /> All done!
                </span>
              )}
            </>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-background text-[12px] font-semibold hover:bg-accent-light transition-colors"
        >
          <Plus size={13} /> Add Habit
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-surface border border-outline rounded-xl p-4 mb-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className={cn(inputCls, "w-14 text-center text-lg")}
              maxLength={4}
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Habit name"
              className={cn(inputCls, "flex-1")}
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 px-3 py-2 rounded-lg bg-surface-raised hover:bg-elevated text-sm text-muted-fg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || isPending}
              className="flex-1 px-3 py-2 rounded-lg bg-accent hover:bg-accent-light text-background text-sm font-semibold disabled:bg-surface-raised disabled:text-subtle-fg transition-colors">
              {isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      )}

      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-outline flex items-center justify-center mb-4">
            <Target size={24} className="text-subtle-fg" />
          </div>
          <p className="text-sm font-medium text-muted-fg">No habits tracked yet</p>
          <p className="text-[12px] text-subtle-fg mt-1">Start building your daily routines</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {habits.map((habit) => {
            const doneToday = habit.logs.some((l) => l.date === today && l.completed);
            return (
            <div
              key={habit.id}
              className={cn(
                "group p-4 rounded-xl border transition-all",
                isPending && "opacity-60 pointer-events-none",
                doneToday
                  ? "border-emerald/25 bg-emerald/5"
                  : "border-outline bg-surface hover:border-outline-strong"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(habit.id)}
                  aria-label={doneToday ? `Mark ${habit.name} as incomplete` : `Mark ${habit.name} as complete`}
                  aria-pressed={doneToday}
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all",
                    doneToday
                      ? "bg-emerald/15 ring-1 ring-emerald/40"
                      : "bg-surface-raised hover:bg-elevated border border-outline"
                  )}
                >
                  {habit.icon}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("font-semibold text-sm", doneToday ? "text-emerald" : "text-foreground")}>
                      {habit.name}
                    </p>
                    <button
                      onClick={() => setConfirmDelete(habit.id)}
                      aria-label="Delete habit"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-subtle-fg hover:text-rose p-1 rounded hover:bg-rose/10 transition-all flex-shrink-0 -mt-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-fg">
                    <span className="flex items-center gap-1">
                      <Flame size={11} className="text-amber-warm" />
                      {habit.currentStreak}d
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy size={11} className="text-accent" />
                      Best {habit.longestStreak}
                    </span>
                  </div>
                </div>
              </div>

              {/* 7-day week strip */}
              <WeekStrip logs={habit.logs} />
            </div>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete habit?"
          description={`"${habits.find((h) => h.id === confirmDelete)?.name}" and all its history will be removed.`}
          onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
