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
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-fg mt-0.5">Your productivity at a glance</p>
        </div>
        <AnalyticsView habits={habits} tasks={tasks} finance={finance} pomodoro={pomodoro} />
      </div>
    </AppShell>
  );
}
