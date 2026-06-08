import { getUpcomingEvents } from "@/lib/services/calendar";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export async function CalendarWidget() {
  const events = await getUpcomingEvents(3);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <CalendarDays size={24} className="mb-2" />
        <p className="text-sm">No upcoming events</p>
        <Link href="/calendar" className="text-blue-400 text-xs mt-1 hover:underline">
          Add an event
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 flex-1">
        {events.map((event) => (
          <div key={event.id} className="flex items-center gap-2">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: event.color }} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{event.title}</p>
              <p className="text-xs text-zinc-500">{format(new Date(event.startTime), "MMM d, h:mm a")}</p>
            </div>
          </div>
        ))}
      </div>
      <Link href="/calendar" className="text-xs text-blue-400 hover:text-blue-300 mt-2 pt-2 border-t border-zinc-800">
        View all events →
      </Link>
    </div>
  );
}
