export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { getUpcomingEvents } from "@/lib/services/calendar";
import { CalendarEvents } from "@/components/features/calendar/calendar-events";

export default async function CalendarPage() {
  const events = await getUpcomingEvents(100);
  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-5 flex-shrink-0 border-b border-outline/70 pb-5">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-fg mt-1">Upcoming events and schedule changes.</p>
        </div>
        <div className="flex-1 min-h-0">
          <CalendarEvents events={events} />
        </div>
      </div>
    </AppShell>
  );
}
