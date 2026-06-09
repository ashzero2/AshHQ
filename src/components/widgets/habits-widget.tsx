import { getHabits } from "@/lib/services/habits";
import { Target, Flame } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export async function HabitsWidget() {
  const habits = await getHabits();

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-subtle-fg">
        <div className="w-10 h-10 rounded-xl bg-surface-raised border border-outline flex items-center justify-center">
          <Target size={17} className="text-muted-fg" />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-fg">No habits tracked</p>
          <Link href="/habits" className="text-[11px] text-accent hover:text-accent-light transition-colors mt-0.5 block">
            Start a habit
          </Link>
        </div>
      </div>
    );
  }

  const completedToday = habits.filter((h) => h.todayCompleted).length;
  const pct = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 bg-surface-raised rounded-full h-1 overflow-hidden">
          <div
            className="h-1 rounded-full bg-emerald transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-muted-fg tabular-nums">{completedToday}/{habits.length}</span>
      </div>

      <div className="space-y-1.5 flex-1 min-h-0 overflow-hidden">
        {habits.slice(0, 4).map((habit) => (
          <div key={habit.id} className="flex items-center gap-2 py-0.5">
            <span className="text-base leading-none">{habit.icon}</span>
            <span
              className={cn(
                "text-[13px] truncate flex-1 leading-snug",
                habit.todayCompleted ? "text-emerald line-through opacity-70" : "text-muted-fg"
              )}
            >
              {habit.name}
            </span>
            {habit.currentStreak > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-amber-warm flex-shrink-0">
                <Flame size={10} />
                {habit.currentStreak}
              </span>
            )}
          </div>
        ))}
      </div>

      <Link
        href="/habits"
        className="text-[11px] text-accent hover:text-accent-light transition-colors mt-2 pt-2 border-t border-outline/60"
      >
        View all habits →
      </Link>
    </div>
  );
}
