import { getHabits } from "@/lib/services/habits";
import { Target, Flame } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export async function HabitsWidget() {
  const habits = await getHabits();

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <Target size={24} className="mb-2" />
        <p className="text-sm">No habits tracked</p>
        <Link href="/habits" className="text-blue-400 text-xs mt-1 hover:underline">
          Start a habit
        </Link>
      </div>
    );
  }

  const completedToday = habits.filter((h) => h.todayCompleted).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-3 mb-3 text-xs">
        <span className="text-green-400">{completedToday}/{habits.length} done today</span>
      </div>
      <div className="space-y-2 flex-1">
        {habits.slice(0, 4).map((habit) => (
          <div key={habit.id} className="flex items-center gap-2 text-sm">
            <span className={cn("w-6 h-6 rounded-md flex items-center justify-center text-xs", habit.todayCompleted ? "bg-green-500/20" : "bg-zinc-800")}>
              {habit.icon}
            </span>
            <span className={cn("truncate", habit.todayCompleted ? "text-green-400 line-through" : "text-zinc-300")}>{habit.name}</span>
            {habit.currentStreak > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-orange-400 ml-auto">
                <Flame size={10} />{habit.currentStreak}
              </span>
            )}
          </div>
        ))}
      </div>
      <Link href="/habits" className="text-xs text-blue-400 hover:text-blue-300 mt-2 pt-2 border-t border-zinc-800">
        View all habits →
      </Link>
    </div>
  );
}
