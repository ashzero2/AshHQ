"use client";

import { useState, useTransition } from "react";
import { createTask, updateTask } from "@/lib/services/tasks";
import { TASK_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { Task } from "@prisma/client";

interface TaskFormProps {
  task?: Task | null;
  onClose: () => void;
}

const inputCls =
  "w-full bg-surface-raised border border-outline rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/60 transition-colors";

export function TaskForm({ task, onClose }: TaskFormProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
  const [status, setStatus] = useState(task?.status ?? "TODO");
  const [category, setCategory] = useState(task?.category ?? "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        if (task) {
          await updateTask({
            id: task.id,
            title: title.trim(),
            description: description.trim() || null,
            priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
            status: status as "TODO" | "IN_PROGRESS" | "DONE",
            category: category || null,
            dueDate: dueDate ? new Date(dueDate) : null,
          });
          toast.success("Task updated");
        } else {
          await createTask({
            title: title.trim(),
            description: description.trim() || null,
            priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
            status: status as "TODO" | "IN_PROGRESS" | "DONE",
            category: category || null,
            dueDate: dueDate ? new Date(dueDate) : null,
          });
          toast.success("Task created");
        }
        onClose();
      } catch {
        toast.error("Failed to save task");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-outline rounded-xl w-full max-w-md shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline">
          <h2 className="text-sm font-semibold text-foreground">
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-fg hover:text-foreground p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-muted-fg block mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-fg block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
              className={inputCls + " resize-none"}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-fg block mb-1.5">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-fg block mb-1.5">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-fg block mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                <option value="">None</option>
                {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-fg block mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-surface-raised hover:bg-elevated text-sm text-muted-fg hover:text-foreground transition-colors border border-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-background text-sm font-semibold disabled:bg-surface-raised disabled:text-subtle-fg transition-colors"
            >
              {isPending ? "Saving…" : task ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
