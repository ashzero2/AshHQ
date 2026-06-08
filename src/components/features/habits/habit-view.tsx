"use client";

import { useState, useTransition } from "react";
import { createHabit, deleteHabit, toggleHabitLog } from "@/lib/services/habits";
import { Plus, Trash2, Target, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface HabitWithStreak {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  todayCompleted: boolean;
  currentStreak: number;
  longestStreak: number;
  logs: { date: string; completed: boolean }[];
}

interface HabitViewProps {
  habits: HabitWithStreak[];
}

export function HabitView({ habits }: HabitViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✅");

  const today = format(new Date(), "yyyy-MM-dd");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await createHabit({ name: name.trim(), icon, color: "#10b981", frequency: "DAILY" });
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
    startTransition(async () => { await deleteHabit(id); toast.success("Habit deleted"); });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-zinc-400">{habits.length} habits tracked</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"><Plus size={16} /> Add Habit</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex gap-3">
            <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} className="w-16 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-center text-lg focus:outline-none focus:border-blue-500" maxLength={4} />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Habit name" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" autoFocus />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">Cancel</button>
            <button type="submit" disabled={!name.trim() || isPending} className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-sm font-medium">{isPending ? "Creating..." : "Create"}</button>
          </div>
        </form>
      )}

      {habits.length === 0 ? (
        <div className="text-center py-12 text-zinc-500"><Target size={32} className="mx-auto mb-2" /><p className="text-sm">No habits tracked yet</p></div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <div key={habit.id} className={cn("group flex items-center gap-4 p-4 rounded-xl border bg-zinc-900/50 transition-all", isPending && "opacity-50", habit.todayCompleted ? "border-green-800/50" : "border-zinc-800")}>
              <button onClick={() => handleToggle(habit.id)} className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all", habit.todayCompleted ? "bg-green-500/20 ring-2 ring-green-500" : "bg-zinc-800 hover:bg-zinc-700")}>
                {habit.icon}
              </button>
              <div className="flex-1">
                <p className={cn("font-medium", habit.todayCompleted && "text-green-400")}>{habit.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" />{habit.currentStreak} day streak</span>
                  <span className="flex items-center gap-1"><Trophy size={12} className="text-yellow-400" />Best: {habit.longestStreak}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(habit.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 transition-all"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
