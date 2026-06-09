import { AppShell } from "@/components/layout/app-shell";
import { getUpcomingEvents } from "@/lib/services/calendar";
import { CalendarEvents } from "@/components/features/calendar/calendar-events";

export default async function CalendarPage() {
  const events = await getUpcomingEvents(100);
  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-5 flex-shrink-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-fg mt-0.5">Manage your schedule and events</p>
        </div>
        <div className="flex-1 min-h-0">
          <CalendarEvents events={events} />
        </div>
      </div>
    </AppShell>
  );
}
