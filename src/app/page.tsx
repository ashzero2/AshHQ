import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { WidgetWrapper } from "@/components/dashboard/widget-wrapper";
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

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]">
        {/* Row 1: Greeting + Clock */}
        <div className="lg:col-span-8 md:col-span-1 row-span-1">
          <W><GreetingWidget /></W>
        </div>
        <div className="lg:col-span-4 md:col-span-1 row-span-1">
          <W><ClockWidget /></W>
        </div>

        {/* Row 2: Weather + Tasks + Calendar */}
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <W title="Weather"><WeatherWidget /></W>
        </div>
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <W title="Tasks"><TasksWidget /></W>
        </div>
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <W title="Calendar"><CalendarWidget /></W>
        </div>

        {/* Row 3: Habits + Finance + Notes */}
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <W title="Habits"><HabitsWidget /></W>
        </div>
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <W title="Finance"><FinanceWidget /></W>
        </div>
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <W title="Notes"><NotesWidget /></W>
        </div>

        {/* Row 4: Quick Links + Pomodoro */}
        <div className="lg:col-span-8 md:col-span-1 row-span-1">
          <W title="Quick Links"><QuickLinksWidget /></W>
        </div>
        <div className="lg:col-span-4 md:col-span-1 row-span-1">
          <W title="Pomodoro"><PomodoroWidget /></W>
        </div>
      </div>
    </AppShell>
  );
}
