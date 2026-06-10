"use client";

import { useState, useTransition } from "react";
import {
  deleteRecurringTask,
  pauseRecurringTask,
} from "@/lib/services/recurring-tasks";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RecurringTaskForm } from "./recurring-task-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Repeat, Pause, Play, Trash2, Pencil } from "lucide-react";
import type { RecurringTask } from "@prisma/client";

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "text-sky",
  MEDIUM: "text-accent",
  HIGH: "text-amber-warm",
  URGENT: "text-rose",
};

function FrequencyLabel({ task }: { task: RecurringTask }) {
  let label = task.frequency.charAt(0) + task.frequency.slice(1).toLowerCase();
  if (task.interval > 1) label = `Every ${task.interval} ${task.frequency.toLowerCase()}s`;
  if (task.frequency === "WEEKLY" && task.daysOfWeek) {
    const days = JSON.parse(task.daysOfWeek) as number[];
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (days.length > 0) label += ` (${days.map((d) => names[d]).join(", ")})`;
  }
  if (task.frequency === "MONTHLY" && task.dayOfMonth) {
    label += ` on day ${task.dayOfMonth}`;
  }
  return <span className="text-[11px] text-muted-fg">{label}</span>;
}

interface Props {
  initialTasks: RecurringTask[];
}

export function RecurringTaskList({ initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [, start] = useTransition();

  const handlePause = (id: string) => {
    start(async () => {
      const updated = await pauseRecurringTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success(updated.status === "PAUSED" ? "Paused" : "Resumed");
    });
  };

  const handleDelete = (id: string) => {
    start(async () => {
      await deleteRecurringTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Recurring task deleted");
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] text-muted-fg">{tasks.length} recurring tasks</p>
        </div>
        <button
          onClick={() => { setEditingTask(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-background text-[12px] font-semibold hover:bg-accent-light transition-colors"
        >
          <Plus size={13} /> New Recurring Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <Repeat size={28} className="mx-auto mb-2 text-subtle-fg" />
          <p className="text-sm text-muted-fg">No recurring tasks yet</p>
          <p className="text-[12px] text-subtle-fg mt-1">Create one to automatically spawn tasks on a schedule</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-3 p-3.5 rounded-xl border bg-surface transition-all ${
                task.status === "PAUSED"
                  ? "border-outline opacity-60"
                  : "border-outline hover:border-outline-strong hover:bg-surface-raised"
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Repeat size={13} className="text-accent" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  <span className={`text-[10px] font-semibold ${PRIORITY_COLOR[task.priority]}`}>
                    {task.priority}
                  </span>
                  {task.status === "PAUSED" && (
                    <span className="text-[10px] font-medium text-muted-fg bg-surface-raised px-1.5 py-0.5 rounded">
                      PAUSED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <FrequencyLabel task={task} />
                  <span className="text-subtle-fg text-[10px]">·</span>
                  <span className="text-[11px] text-muted-fg">
                    Next: {format(new Date(task.nextDueAt), "MMM d")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingTask(task); setShowForm(true); }}
                  aria-label="Edit recurring task"
                  className="p-1.5 rounded-lg text-subtle-fg hover:text-foreground hover:bg-surface-raised transition-colors"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handlePause(task.id)}
                  aria-label={task.status === "PAUSED" ? "Resume" : "Pause"}
                  className="p-1.5 rounded-lg text-subtle-fg hover:text-accent hover:bg-accent/10 transition-colors"
                >
                  {task.status === "PAUSED" ? <Play size={12} /> : <Pause size={12} />}
                </button>
                <button
                  onClick={() => setConfirmDelete(task.id)}
                  aria-label="Delete recurring task"
                  className="p-1.5 rounded-lg text-subtle-fg hover:text-rose hover:bg-rose/10 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showForm) && (
        <RecurringTaskForm
          task={editingTask ?? undefined}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          onSave={(saved) => {
            setTasks((prev) =>
              editingTask
                ? prev.map((t) => (t.id === saved.id ? saved : t))
                : [saved, ...prev]
            );
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete recurring task?"
          description="This will remove the recurring template. Existing spawned tasks are not affected."
          onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
