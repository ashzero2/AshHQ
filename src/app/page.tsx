export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { WidgetWrapper } from "@/components/dashboard/widget-wrapper";
import { DashboardGrid, type LayoutItem } from "@/components/dashboard/dashboard-grid";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { WidgetSkeleton } from "@/components/shared/widget-skeleton";
import { GreetingWidget } from "@/components/widgets/greeting-widget";
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
import { getSettings } from "@/lib/services/settings";

const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: "greeting",    x: 0, y: 0,  w: 8, h: 2, minW: 4, minH: 1 },
  { i: "clock",       x: 8, y: 0,  w: 4, h: 2, minW: 2, minH: 1 },
  { i: "weather",     x: 0, y: 2,  w: 4, h: 3, minW: 2, minH: 2 },
  { i: "tasks",       x: 4, y: 2,  w: 4, h: 3, minW: 2, minH: 2 },
  { i: "calendar",    x: 8, y: 2,  w: 4, h: 3, minW: 2, minH: 2 },
  { i: "habits",      x: 0, y: 5,  w: 4, h: 3, minW: 2, minH: 2 },
  { i: "finance",     x: 4, y: 5,  w: 4, h: 3, minW: 2, minH: 2 },
  { i: "notes",       x: 8, y: 5,  w: 4, h: 3, minW: 2, minH: 2 },
  { i: "quick-links", x: 0, y: 8,  w: 8, h: 2, minW: 2, minH: 1 },
  { i: "pomodoro",    x: 8, y: 8,  w: 4, h: 2, minW: 2, minH: 2 },
  { i: "analytics",   x: 0, y: 10, w: 4, h: 3, minW: 3, minH: 2 },
];

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

export default async function DashboardPage() {
  const settings = await getSettings();

  let savedLayout: LayoutItem[] = DEFAULT_LAYOUT;
  try {
    const parsed = JSON.parse(settings.dashboardLayout || "{}");
    if (Array.isArray(parsed) && parsed.length > 0) {
      savedLayout = parsed;
    }
  } catch { /* use default */ }

  // Merge: keep saved positions but add any new widgets from DEFAULT_LAYOUT
  const savedIds = new Set(savedLayout.map((l) => l.i));
  const merged = [
    ...savedLayout,
    ...DEFAULT_LAYOUT.filter((d) => !savedIds.has(d.i)),
  ];

  return (
    <AppShell>
      <DashboardGrid savedLayout={merged}>
        <div key="greeting"><W><GreetingWidget /></W></div>
        <div key="clock"><W><ClockWidget /></W></div>
        <div key="weather"><W title="Weather"><WeatherWidget /></W></div>
        <div key="tasks"><W title="Tasks"><TasksWidget /></W></div>
        <div key="calendar"><W title="Calendar"><CalendarWidget /></W></div>
        <div key="habits"><W title="Habits"><HabitsWidget /></W></div>
        <div key="finance"><W title="Finance"><FinanceWidget /></W></div>
        <div key="notes"><W title="Notes"><NotesWidget /></W></div>
        <div key="quick-links"><W title="Quick Links"><QuickLinksWidget /></W></div>
        <div key="pomodoro"><W title="Pomodoro"><PomodoroWidget /></W></div>
        <div key="analytics"><W title="Analytics"><AnalyticsWidget /></W></div>
      </DashboardGrid>
    </AppShell>
  );
}
