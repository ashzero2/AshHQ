"use client";

import { useState, useTransition } from "react";
import { createEvent, deleteEvent } from "@/lib/services/calendar";
import { format } from "date-fns";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { CalendarEvent } from "@prisma/client";

interface CalendarEventsProps {
  events: CalendarEvent[];
}

export function CalendarEvents({ events }: CalendarEventsProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");

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
          color: "#3b82f6",
          allDay: false,
        });
        toast.success("Event created");
        setTitle("");
        setDescription("");
        setStartTime("");
        setEndTime("");
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-zinc-400">{events.length} upcoming events</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors">
          <Plus size={16} /> Add Event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 space-y-3">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" autoFocus />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Start</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">End</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">Cancel</button>
            <button type="submit" disabled={!title.trim() || !startTime || !endTime || isPending} className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-sm font-medium">{isPending ? "Creating..." : "Create"}</button>
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <CalendarDays size={32} className="mx-auto mb-2" />
          <p className="text-sm">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="group flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50">
              <div className="w-1 h-10 rounded-full" style={{ backgroundColor: event.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.title}</p>
                <p className="text-xs text-zinc-500">{format(new Date(event.startTime), "MMM d, h:mm a")} — {format(new Date(event.endTime), "h:mm a")}</p>
              </div>
              <button onClick={() => handleDelete(event.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
