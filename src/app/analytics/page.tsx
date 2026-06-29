export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import {
  getHabitAnalytics,
  getTaskAnalytics,
  getFinanceAnalytics,
  getPomodoroAnalytics,
} from "@/lib/services/analytics";
import { AnalyticsView } from "@/components/features/analytics/analytics-view";

export default async function AnalyticsPage() {
  const [habits, tasks, finance, pomodoro] = await Promise.all([
    getHabitAnalytics(),
    getTaskAnalytics(),
    getFinanceAnalytics(),
    getPomodoroAnalytics(),
  ]);

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-6 flex-shrink-0 border-b border-outline/70 pb-5">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Review</h1>
          <p className="text-sm text-muted-fg mt-1">Task, habit, finance, and focus trends.</p>
        </div>
        <AnalyticsView habits={habits} tasks={tasks} finance={finance} pomodoro={pomodoro} />
      </div>
    </AppShell>
  );
}
