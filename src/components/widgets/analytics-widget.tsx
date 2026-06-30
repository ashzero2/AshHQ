import Link from "next/link";
import {
  getHabitAnalytics,
  getTaskAnalytics,
  getFinanceAnalytics,
  getPomodoroAnalytics,
} from "@/lib/services/analytics";
import { formatCurrency } from "@/lib/utils";
import { BarChart2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

function Stat({
  label,
  value,
  sub,
  colorClass,
}: {
  label: string;
  value: string | number;
  sub: string;
  colorClass: string;
}) {
  return (
    <div className="flex flex-col justify-center p-3 rounded-xl bg-surface-raised border border-outline/50">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-subtle-fg mb-1 truncate">
        {label}
      </p>
      <p className={cn("text-xl font-bold tabular-nums leading-none", colorClass)}>{value}</p>
      <p className="text-[10px] text-muted-fg mt-0.5 truncate">{sub}</p>
    </div>
  );
}

function MiniBar({ sessions }: { sessions: number[] }) {
  const max = Math.max(...sessions, 1);
  return (
    <div className="flex items-end gap-0.5 h-6">
      {sessions.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-[2px] bg-sky/60 min-h-[2px]"
          style={{ height: v > 0 ? `${Math.round((v / max) * 100)}%` : "2px", opacity: v > 0 ? 1 : 0.2 }}
        />
      ))}
    </div>
  );
}

export async function AnalyticsWidget() {
  const [habits, tasks, finance, pomodoro] = await Promise.all([
    getHabitAnalytics(),
    getTaskAnalytics(),
    getFinanceAnalytics(),
    getPomodoroAnalytics(),
  ]);

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* 4 key stats */}
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label="Habits"
          value={`${habits.weekCompletionRate}%`}
          sub="this week"
          colorClass="text-emerald"
        />
        <Stat
          label="Tasks done"
          value={tasks.completedThisWeek}
          sub={tasks.overdue > 0 ? `${tasks.overdue} overdue` : "this week"}
          colorClass={tasks.overdue > 0 ? "text-rose" : "text-foreground"}
        />
        <Stat
          label="Bills"
          value={formatCurrency(finance.totalMonthly)}
          sub={`${finance.totalActive} active`}
          colorClass="text-foreground"
        />
        <Stat
          label="Focus"
          value={pomodoro.thisWeekSessions}
          sub={`${pomodoro.thisWeekMinutes}m this week`}
          colorClass="text-sky"
        />
      </div>

      {/* Mini focus bar chart + delta row */}
      <div className="flex-1 flex flex-col justify-between min-h-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] uppercase tracking-[0.12em] text-subtle-fg font-semibold">
            Focus 7d
          </span>
          <div className="flex-1">
            <MiniBar sessions={pomodoro.last7.map((d) => d.sessions)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {finance.dueSoonCount > 0 && (
            <span className={cn("text-[10px] tabular-nums text-rose")}>
              {finance.dueSoonCount} bill{finance.dueSoonCount !== 1 ? "s" : ""} due in 30d
            </span>
          )}
        </div>
      </div>

      <Link
        href="/analytics"
        className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] text-muted-fg hover:text-foreground hover:bg-surface-raised transition-colors border border-outline/40 hover:border-outline"
      >
        <BarChart2 size={11} />
        Full analytics
        <ArrowRight size={10} />
      </Link>
    </div>
  );
}
