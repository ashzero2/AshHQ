import { AppShell } from "@/components/layout/app-shell";
import { getUpcomingEvents } from "@/lib/services/calendar";
import { CalendarEvents } from "@/components/features/calendar/calendar-events";

export default async function CalendarPage() {
  const events = await getUpcomingEvents(20);
  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Calendar</h1>
        <CalendarEvents events={events} />
      </div>
    </AppShell>
  );
}
