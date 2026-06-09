"use client";

import { formatCurrency } from "@/lib/utils";

interface HabitAnalytics {
  total: number;
  weekCompletionRate: number;
  bestStreak: number;
  habitRates: { id: string; name: string; icon: string; completionRate: number; currentStreak: number }[];
}

interface TaskAnalytics {
  total: number;
  completed: number;
  completedThisWeek: number;
  completedThisMonth: number;
  overdue: number;
  completionRate: number;
  byPriority: { priority: string; count: number }[];
  completionTrend: { day: string; date: string; count: number }[];
}

interface FinanceAnalytics {
  thisIncome: number;
  thisExpenses: number;
  balance: number;
  savingsRate: number;
  incomeDelta: number;
  expensesDelta: number;
  topCategories: { category: string; amount: number; pct: number }[];
}

interface PomodoroAnalytics {
  totalSessions: number;
  totalMinutes: number;
  thisWeekSessions: number;
  thisWeekMinutes: number;
  streak: number;
  last7: { day: string; sessions: number }[];
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-surface border border-outline rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg mb-2">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color ?? "text-foreground"}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-fg mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle-fg mb-3 mt-6 first:mt-0">
      {title}
    </h2>
  );
}

function HBar({ pct, color = "bg-accent" }: { pct: number; color?: string }) {
  return (
    <div className="flex-1 bg-surface-raised rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function MiniBarChart({ data, max, color = "bg-accent/70" }: { data: number[]; max?: number; color?: string }) {
  const m = max ?? Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-sm transition-all ${color} min-h-[2px]`}
          style={{ height: v > 0 ? `${Math.round((v / m) * 100)}%` : "2px", opacity: v > 0 ? 1 : 0.2 }}
        />
      ))}
    </div>
  );
}

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "bg-sky/70",
  MEDIUM: "bg-accent/70",
  HIGH: "bg-amber-warm/70",
  URGENT: "bg-rose/70",
};

export function AnalyticsView({
  habits,
  tasks,
  finance,
  pomodoro,
}: {
  habits: HabitAnalytics;
  tasks: TaskAnalytics;
  finance: FinanceAnalytics;
  pomodoro: PomodoroAnalytics;
}) {
  const totalTasksActive = tasks.total - tasks.completed;

  return (
    <div className="pb-6">
      {/* ── Summary row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
        <StatCard label="Habits this week" value={`${habits.weekCompletionRate}%`} sub={`${habits.total} habits tracked`} color="text-emerald" />
        <StatCard label="Tasks done" value={tasks.completed} sub={`${totalTasksActive} active · ${tasks.overdue} overdue`} color={tasks.overdue > 0 ? "text-rose" : "text-foreground"} />
        <StatCard label="This month" value={formatCurrency(finance.balance)} sub={`${finance.savingsRate}% savings rate`} color={finance.balance >= 0 ? "text-emerald" : "text-rose"} />
        <StatCard label="Focus sessions" value={pomodoro.totalSessions} sub={`${Math.round(pomodoro.totalMinutes / 60)}h total focus`} color="text-sky" />
      </div>

      {/* ── Habits ── */}
      <SectionHeader title="Habits" />
      <div className="bg-surface border border-outline rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] text-muted-fg">30-day completion rate per habit</span>
          <span className="text-[11px] text-muted-fg">Best streak: <span className="text-foreground font-semibold">{habits.bestStreak}d</span></span>
        </div>
        {habits.habitRates.length === 0 ? (
          <p className="text-sm text-muted-fg text-center py-4">No habits yet</p>
        ) : (
          <div className="space-y-3">
            {habits.habitRates.map((h) => (
              <div key={h.id} className="flex items-center gap-3">
                <span className="text-base w-6 flex-shrink-0">{h.icon}</span>
                <span className="text-[12px] text-muted-fg w-28 truncate">{h.name}</span>
                <HBar pct={h.completionRate} color="bg-emerald/70" />
                <span className="text-[11px] text-muted-fg w-9 text-right tabular-nums">{h.completionRate}%</span>
                {h.currentStreak > 0 && (
                  <span className="text-[10px] text-amber-warm tabular-nums w-10 text-right">🔥 {h.currentStreak}d</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tasks ── */}
      <SectionHeader title="Tasks" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-surface border border-outline rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg mb-3">Completion Trend (7d)</p>
          <MiniBarChart data={tasks.completionTrend.map((d) => d.count)} color="bg-accent/70" />
          <div className="flex justify-between mt-2">
            {tasks.completionTrend.map((d) => (
              <span key={d.date} className="text-[9px] text-subtle-fg flex-1 text-center">{d.day}</span>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-outline rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg mb-3">By Priority (Active)</p>
          <div className="space-y-2.5">
            {tasks.byPriority.map((p) => {
              const maxCount = Math.max(...tasks.byPriority.map((x) => x.count), 1);
              return (
                <div key={p.priority} className="flex items-center gap-2.5">
                  <span className="text-[11px] text-muted-fg w-16">{p.priority.charAt(0) + p.priority.slice(1).toLowerCase()}</span>
                  <HBar pct={(p.count / maxCount) * 100} color={PRIORITY_COLOR[p.priority]} />
                  <span className="text-[11px] text-muted-fg w-5 text-right tabular-nums">{p.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Finance ── */}
      <SectionHeader title="Finance" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-surface border border-outline rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg mb-3">This Month</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-muted-fg">Income</span>
              <span className="text-sm font-semibold text-emerald tabular-nums">+{formatCurrency(finance.thisIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-muted-fg">Expenses</span>
              <span className="text-sm font-semibold text-rose tabular-nums">−{formatCurrency(finance.thisExpenses)}</span>
            </div>
            <div className="border-t border-outline pt-3 flex justify-between items-center">
              <span className="text-[12px] text-muted-fg">Savings rate</span>
              <span className={`text-sm font-bold tabular-nums ${finance.savingsRate >= 0 ? "text-emerald" : "text-rose"}`}>
                {finance.savingsRate}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg mb-3">Top Expense Categories</p>
          {finance.topCategories.length === 0 ? (
            <p className="text-sm text-muted-fg text-center py-4">No expenses this month</p>
          ) : (
            <div className="space-y-2.5">
              {finance.topCategories.map((c) => (
                <div key={c.category} className="flex items-center gap-2.5">
                  <span className="text-[11px] text-muted-fg w-24 truncate">{c.category}</span>
                  <HBar pct={c.pct} color="bg-rose/60" />
                  <span className="text-[10px] text-muted-fg w-14 text-right tabular-nums">{formatCurrency(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Focus ── */}
      <SectionHeader title="Focus (Pomodoro)" />
      <div className="bg-surface border border-outline rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div>
            <p className="text-[10px] text-subtle-fg mb-1">This week</p>
            <p className="text-lg font-bold text-foreground">{pomodoro.thisWeekSessions}</p>
            <p className="text-[10px] text-muted-fg">sessions</p>
          </div>
          <div>
            <p className="text-[10px] text-subtle-fg mb-1">Focus time</p>
            <p className="text-lg font-bold text-foreground">{pomodoro.thisWeekMinutes}m</p>
            <p className="text-[10px] text-muted-fg">this week</p>
          </div>
          <div>
            <p className="text-[10px] text-subtle-fg mb-1">Total sessions</p>
            <p className="text-lg font-bold text-foreground">{pomodoro.totalSessions}</p>
            <p className="text-[10px] text-muted-fg">all time</p>
          </div>
          <div>
            <p className="text-[10px] text-subtle-fg mb-1">Day streak</p>
            <p className="text-lg font-bold text-amber-warm">{pomodoro.streak}</p>
            <p className="text-[10px] text-muted-fg">days</p>
          </div>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg mb-2">Sessions Last 7 Days</p>
        <MiniBarChart data={pomodoro.last7.map((d) => d.sessions)} color="bg-sky/70" />
        <div className="flex justify-between mt-1.5">
          {pomodoro.last7.map((d) => (
            <span key={d.day} className="text-[9px] text-subtle-fg flex-1 text-center">{d.day}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
