export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { format } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { WidgetWrapper } from "@/components/dashboard/widget-wrapper";
import { ResponsiveGrid } from "@/components/dashboard/responsive-grid";
import { WorkbenchLayout } from "@/components/dashboard/workbench-layout";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { WidgetSkeleton } from "@/components/shared/widget-skeleton";
import { ClockWidget } from "@/components/widgets/clock-widget";
import { WeatherWidget } from "@/components/widgets/weather-widget";
import { TasksWidget } from "@/components/widgets/tasks-widget";
import { CalendarWidget } from "@/components/widgets/calendar-widget";
import { HabitsWidget } from "@/components/widgets/habits-widget";
import { FinanceWidget } from "@/components/widgets/finance-widget";
import { NotesWidget } from "@/components/widgets/notes-widget";
import { QuickLinksWidget } from "@/components/widgets/quick-links-widget";
import { PomodoroWidget } from "@/components/widgets/pomodoro-widget";
import { AnalyticsWidget } from "@/components/widgets/analytics-widget";
import { getTaskStats } from "@/lib/services/tasks";
import { getUpcomingEvents } from "@/lib/services/calendar";
import { getHabits } from "@/lib/services/habits";
import { prisma } from "@/lib/db";
import { addDays } from "date-fns";

function W({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <WidgetWrapper title={title}>
      <ErrorBoundary>
        <Suspense fallback={<WidgetSkeleton />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </WidgetWrapper>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 border-l border-outline/70 pl-4 first:border-l-0 first:pl-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle-fg">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-muted-fg">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const [taskStats, events, habits, billsDue] = await Promise.all([
    getTaskStats(),
    getUpcomingEvents(4),
    getHabits(),
    prisma.recurringExpense.count({
      where: { status: "ACTIVE", nextDueAt: { lte: addDays(now, 7) } },
    }),
  ]);

  const completedHabits = habits.filter((habit) => habit.todayCompleted).length;

  const openTasks = Math.max(taskStats.total - taskStats.completed, 0);

  return (
    <AppShell>
      <div className="space-y-4">
        <section className="grid gap-5 border-b border-outline/70 pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.85fr)] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-subtle-fg">
              {format(now, "EEEE, MMM d")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance">
              Today
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-fg">
              Tasks, schedule, habits, and spending in one working view.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Open" value={String(openTasks)} sub={`${taskStats.overdue} overdue`} />
            <Stat label="Events" value={String(events.length)} sub="Next up" />
            <Stat label="Habits" value={`${completedHabits}/${habits.length}`} sub="Done today" />
            <Stat label="Bills due" value={String(billsDue)} sub="Next 7 days" />
          </div>
        </section>

        <WorkbenchLayout
          main={
            <>
              <ResponsiveGrid columns={2}>
                <div className="min-h-[260px]">
                  <W title="Tasks"><TasksWidget /></W>
                </div>
                <div className="min-h-[260px]">
                  <W title="Calendar"><CalendarWidget /></W>
                </div>
              </ResponsiveGrid>

              <ResponsiveGrid columns={3}>
                <div className="min-h-[220px]">
                  <W title="Bills"><FinanceWidget /></W>
                </div>
                <div className="min-h-[220px]">
                  <W title="Notes"><NotesWidget /></W>
                </div>
                <div className="min-h-[220px]">
                  <W title="Quick Links"><QuickLinksWidget /></W>
                </div>
              </ResponsiveGrid>

              <ResponsiveGrid columns={2}>
                <div className="min-h-[260px]">
                  <W title="Focus"><PomodoroWidget /></W>
                </div>
                <div className="min-h-[260px]">
                  <W title="Review"><AnalyticsWidget /></W>
                </div>
              </ResponsiveGrid>
            </>
          }
          rail={
            <>
            <div className="min-h-[150px]">
              <W><ClockWidget /></W>
            </div>
            <div className="min-h-[220px]">
              <W title="Weather"><WeatherWidget /></W>
            </div>
            <div className="min-h-[260px] sm:col-span-2 lg:col-span-1">
              <W title="Habits"><HabitsWidget /></W>
            </div>
            </>
          }
        />
      </div>
    </AppShell>
  );
}
