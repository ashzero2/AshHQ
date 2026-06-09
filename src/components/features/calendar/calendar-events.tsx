"use client";

import { useState, useTransition } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  subMonths,
  addMonths,
  isSameMonth,
} from "date-fns";
import { createEvent, deleteEvent } from "@/lib/services/calendar";
import { Plus, Trash2, ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@prisma/client";

interface CalendarEventsProps {
  events: CalendarEvent[];
}

const inputCls =
  "w-full bg-surface-raised border border-outline rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/60 transition-colors";

export function CalendarEvents({ events }: CalendarEventsProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;
    startTransition(async () => {
      try {
        await createEvent({
          title: title.trim(),
          description: description.trim() || null,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          color: "#e8c06c",
          allDay: false,
        });
        toast.success("Event created");
        setTitle(""); setDescription(""); setStartTime(""); setEndTime("");
        setShowForm(false);
      } catch { toast.error("Failed to create event"); }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteEvent(id);
      toast.success("Event deleted");
    });
  };

  /* ── Calendar grid helpers ── */
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const eventsByDay = new Map<string, CalendarEvent[]>();
  events.forEach((e) => {
    const key = format(new Date(e.startTime), "yyyy-MM-dd");
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(e);
  });

  /* Events to show in the list — filtered by selected day if any */
  const visibleEvents = selectedDay
    ? events.filter((e) => isSameDay(new Date(e.startTime), selectedDay))
    : events;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 lg:h-full">

      {/* ── LEFT: Calendar grid ── */}
      <div className="bg-surface border border-outline rounded-xl p-5 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.3)] h-fit">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => { setCurrentMonth(subMonths(currentMonth, 1)); setSelectedDay(null); }}
              className="p-1.5 rounded-lg text-muted-fg hover:text-foreground hover:bg-surface-raised transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => { setCurrentMonth(new Date()); setSelectedDay(null); }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-fg hover:text-foreground hover:bg-surface-raised transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => { setCurrentMonth(addMonths(currentMonth, 1)); setSelectedDay(null); }}
              className="p-1.5 rounded-lg text-muted-fg hover:text-foreground hover:bg-surface-raised transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-2">
          {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((d) => (
            <div key={d} className="text-center text-[9px] font-semibold tracking-widest text-subtle-fg py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(dateStr) ?? [];
            const _isToday = isToday(day);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={cn(
                  "relative flex flex-col items-center py-1.5 rounded-lg transition-colors cursor-pointer",
                  isSelected
                    ? "bg-accent text-background font-semibold"
                    : _isToday
                    ? "bg-accent/12 text-accent font-semibold"
                    : "text-muted-fg hover:bg-surface-raised hover:text-foreground"
                )}
              >
                <span className="text-[13px] leading-none">{format(day, "d")}</span>
                {dayEvents.length > 0 && (
                  <span
                    className={cn(
                      "w-1 h-1 rounded-full mt-1",
                      isSelected
                        ? "bg-background/70"
                        : _isToday
                        ? "bg-accent"
                        : "bg-accent/50"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day info */}
        {selectedDay && (
          <div className="mt-4 pt-4 border-t border-outline flex items-center justify-between">
            <p className="text-[12px] text-muted-fg">
              {format(selectedDay, "EEEE, MMMM d")}
              <span className="text-subtle-fg ml-1.5">
                · {(eventsByDay.get(format(selectedDay, "yyyy-MM-dd")) ?? []).length} events
              </span>
            </p>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-subtle-fg hover:text-foreground p-1 rounded transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: Events list ── */}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {selectedDay ? format(selectedDay, "EEEE, MMMM d") : "Upcoming Events"}
            </h2>
            <p className="text-[12px] text-muted-fg mt-0.5">
              {visibleEvents.length} event{visibleEvents.length !== 1 ? "s" : ""}
              {selectedDay && (
                <button onClick={() => setSelectedDay(null)} className="ml-2 text-accent hover:text-accent-light transition-colors">
                  Show all
                </button>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-background text-[12px] font-semibold hover:bg-accent-light transition-colors"
          >
            <Plus size={13} /> Add Event
          </button>
        </div>

        {/* Add event form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-surface border border-outline rounded-xl p-4 mb-4 space-y-3 flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
          >
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title" className={inputCls} autoFocus />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)" rows={2}
              className={inputCls + " resize-none"} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-fg block mb-1">Start</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    // auto-set end to 1 hour later if end is empty or hasn't been manually changed
                    if (e.target.value && (!endTime || endTime === startTime)) {
                      const d = new Date(e.target.value);
                      d.setHours(d.getHours() + 1);
                      const pad = (n: number) => String(n).padStart(2, "0");
                      setEndTime(
                        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
                      );
                    }
                  }}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-fg block mb-1">End</label>
                <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 px-3 py-2 rounded-lg bg-surface-raised hover:bg-elevated text-sm text-muted-fg hover:text-foreground transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!title.trim() || !startTime || !endTime || isPending}
                className="flex-1 px-3 py-2 rounded-lg bg-accent hover:bg-accent-light text-background text-sm font-semibold disabled:bg-surface-raised disabled:text-subtle-fg transition-colors">
                {isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        )}

        {/* Events */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {visibleEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <CalendarDays size={28} className="text-subtle-fg mb-3" />
              <p className="text-sm text-muted-fg">
                {selectedDay ? "No events on this day" : "No upcoming events"}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="text-[12px] text-accent hover:text-accent-light transition-colors mt-2"
              >
                Add an event
              </button>
            </div>
          ) : (
            visibleEvents.map((event) => (
              <div
                key={event.id}
                className="group flex items-center gap-3 p-3.5 rounded-xl border border-outline bg-surface hover:border-outline-strong hover:bg-surface-raised transition-all"
              >
                <div className="w-[3px] h-10 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <p className="text-[12px] text-muted-fg mt-0.5">
                    {format(new Date(event.startTime), "MMM d, h:mm a")} — {format(new Date(event.endTime), "h:mm a")}
                  </p>
                  {event.description && (
                    <p className="text-[11px] text-subtle-fg mt-0.5 truncate">{event.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="opacity-0 group-hover:opacity-100 text-subtle-fg hover:text-rose p-1.5 rounded-lg hover:bg-rose/10 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
