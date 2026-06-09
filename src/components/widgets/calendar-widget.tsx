import { getUpcomingEvents } from "@/lib/services/calendar";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export async function CalendarWidget() {
  const events = await getUpcomingEvents(4);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-subtle-fg">
        <div className="w-10 h-10 rounded-xl bg-surface-raised border border-outline flex items-center justify-center">
          <CalendarDays size={17} className="text-muted-fg" />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-fg">No upcoming events</p>
          <Link href="/calendar" className="text-[11px] text-accent hover:text-accent-light transition-colors mt-0.5 block">
            Add an event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 flex-1 min-h-0 overflow-hidden">
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-2.5 py-0.5">
            <div
              className="w-[3px] h-8 rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: event.color }}
            />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate leading-snug">{event.title}</p>
              <p className="text-[11px] text-muted-fg">{format(new Date(event.startTime), "MMM d, h:mm a")}</p>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/calendar"
        className="text-[11px] text-accent hover:text-accent-light transition-colors mt-2 pt-2 border-t border-outline/60"
      >
        View calendar →
      </Link>
    </div>
  );
}
