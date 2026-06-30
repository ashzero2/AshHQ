"use client";

import { useState, useTransition } from "react";
import { createRecurringTask, updateRecurringTask } from "@/lib/services/recurring-tasks";
import { toast } from "sonner";
import { format } from "date-fns";
import { X } from "lucide-react";
import type { RecurringTask } from "@prisma/client";

const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  task?: RecurringTask;
  onClose: () => void;
  onSave: (task: RecurringTask) => void;
}

const inputCls =
  "w-full bg-surface-raised border border-outline rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/60 transition-colors";

export function RecurringTaskForm({ task, onClose, onSave }: Props) {
  const [isPending, start] = useTransition();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
  const [frequency, setFrequency] = useState<string>(task?.frequency ?? "DAILY");
  const [interval, setInterval] = useState(task?.interval ?? 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    task?.daysOfWeek ? JSON.parse(task.daysOfWeek) : []
  );
  const [dayOfMonth, setDayOfMonth] = useState(task?.dayOfMonth ?? 1);
  const [nextDueAt, setNextDueAt] = useState(
    task?.nextDueAt ? format(new Date(task.nextDueAt), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [reminderTime, setReminderTime] = useState(task?.reminderTime ?? "");

  const toggleDay = (day: number) =>
    setDaysOfWeek((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    start(async () => {
      try {
        const nextDueDate = reminderTime
          ? new Date(`${nextDueAt}T${reminderTime}`)
          : new Date(nextDueAt);
        const data = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
          frequency: frequency as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM",
          interval,
          daysOfWeek: frequency === "WEEKLY" && daysOfWeek.length > 0 ? daysOfWeek : undefined,
          dayOfMonth: frequency === "MONTHLY" ? dayOfMonth : undefined,
          reminderTime: reminderTime || undefined,
          nextDueAt: nextDueDate,
        };
        if (task) {
          const updated = await updateRecurringTask(task.id, data);
          onSave(updated);
          toast.success("Recurring task updated");
        } else {
          const created = await createRecurringTask(data);
          onSave(created);
          toast.success("Recurring task created");
        }
        onClose();
      } catch {
        toast.error("Failed to save recurring task");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-surface border border-outline rounded-2xl p-5 w-full max-w-md shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rt-form-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="rt-form-title" className="text-sm font-semibold text-foreground">
            {task ? "Edit Recurring Task" : "New Recurring Task"}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-fg hover:text-foreground p-1 rounded-lg">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className={inputCls}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className={inputCls}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-fg block mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-fg block mb-1">Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls}>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-fg block mb-1">Every N {frequency.toLowerCase()}s</label>
              <input
                type="number"
                min={1}
                max={365}
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-fg block mb-1">First due date</label>
              <input type="date" value={nextDueAt} onChange={(e) => setNextDueAt(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-fg block mb-1">Reminder time <span className="text-subtle-fg">(optional — default: start of day)</span></label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className={inputCls}
            />
          </div>

          {frequency === "WEEKLY" && (
            <div>
              <label className="text-[11px] text-muted-fg block mb-1.5">On days (optional)</label>
              <div className="flex gap-1">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-colors ${
                      daysOfWeek.includes(i)
                        ? "bg-accent text-background"
                        : "bg-surface-raised text-muted-fg border border-outline"
                    }`}
                  >
                    {d.slice(0, 1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequency === "MONTHLY" && (
            <div>
              <label className="text-[11px] text-muted-fg block mb-1">Day of month</label>
              <input
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-surface-raised hover:bg-elevated text-sm text-muted-fg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isPending}
              className="flex-1 py-2 rounded-lg bg-accent hover:bg-accent-light text-background text-sm font-semibold disabled:bg-surface-raised disabled:text-subtle-fg transition-colors"
            >
              {isPending ? "Saving…" : task ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
