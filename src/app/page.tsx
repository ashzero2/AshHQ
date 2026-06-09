import { AppShell } from "@/components/layout/app-shell";
import { WidgetWrapper } from "@/components/dashboard/widget-wrapper";
import { GreetingWidget } from "@/components/widgets/greeting-widget";
import { ClockWidget } from "@/components/widgets/clock-widget";
import { WeatherWidget } from "@/components/widgets/weather-widget";
import { TasksWidget } from "@/components/widgets/tasks-widget";
import { CalendarWidget } from "@/components/widgets/calendar-widget";
import { HabitsWidget } from "@/components/widgets/habits-widget";
import { FinanceWidget } from "@/components/widgets/finance-widget";
import { NotesWidget } from "@/components/widgets/notes-widget";
import { QuickLinksWidget } from "@/components/widgets/quick-links-widget";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]">
        {/* Row 1: Greeting + Clock */}
        <div className="lg:col-span-8 md:col-span-1 row-span-1">
          <WidgetWrapper>
            <GreetingWidget />
          </WidgetWrapper>
        </div>
        <div className="lg:col-span-4 md:col-span-1 row-span-1">
          <WidgetWrapper>
            <ClockWidget />
          </WidgetWrapper>
        </div>

        {/* Row 2: Weather + Tasks + Calendar */}
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <WidgetWrapper title="Weather">
            <WeatherWidget />
          </WidgetWrapper>
        </div>
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <WidgetWrapper title="Tasks">
            <TasksWidget />
          </WidgetWrapper>
        </div>
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <WidgetWrapper title="Calendar">
            <CalendarWidget />
          </WidgetWrapper>
        </div>

        {/* Row 3: Habits + Finance + Notes */}
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <WidgetWrapper title="Habits">
            <HabitsWidget />
          </WidgetWrapper>
        </div>
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <WidgetWrapper title="Finance">
            <FinanceWidget />
          </WidgetWrapper>
        </div>
        <div className="lg:col-span-4 md:col-span-1 row-span-2">
          <WidgetWrapper title="Notes">
            <NotesWidget />
          </WidgetWrapper>
        </div>

        {/* Row 4: Quick Links (full width) */}
        <div className="lg:col-span-12 md:col-span-2 row-span-1">
          <WidgetWrapper title="Quick Links">
            <QuickLinksWidget />
          </WidgetWrapper>
        </div>
      </div>
    </AppShell>
  );
}
