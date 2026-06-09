"use client";

import { useState, useTransition } from "react";
import { updateTask, deleteTask } from "@/lib/services/tasks";
import { cn } from "@/lib/utils";
import { Check, Trash2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Task } from "@prisma/client";

const priorityStyles: Record<string, { dot: string; badge: string }> = {
  LOW: { dot: "bg-subtle-fg", badge: "text-muted-fg bg-surface-raised" },
  MEDIUM: { dot: "bg-sky", badge: "text-sky bg-sky/10" },
  HIGH: { dot: "bg-amber-warm", badge: "text-amber-warm bg-amber-warm/10" },
  URGENT: { dot: "bg-rose", badge: "text-rose bg-rose/10" },
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const isDone = task.status === "DONE";

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await updateTask({ id: task.id, status: isDone ? "TODO" : "DONE" });
    });
  };

  const confirmDelete = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTask(task.id);
      toast.success("Task deleted");
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone;
  const styles = priorityStyles[task.priority] ?? priorityStyles.MEDIUM;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onEdit(task)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEdit(task); }
        }}
        className={cn(
          "group flex items-start gap-3 p-3.5 rounded-xl border bg-surface cursor-pointer transition-all",
          "hover:border-outline-strong hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          isDone ? "border-outline/40 opacity-60" : "border-outline",
          isPending && "opacity-40 pointer-events-none"
        )}
      >
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggle(e); } }}
          aria-label={isDone ? "Mark as incomplete" : "Mark as complete"}
          className={cn(
            "flex-shrink-0 w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all",
            isDone
              ? "bg-emerald border-emerald"
              : "border-outline-strong hover:border-accent"
          )}
        >
          {isDone && <Check size={11} className="text-background" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", isDone ? "line-through text-muted-fg" : "text-foreground")}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", styles.badge)}>
              {task.priority.toLowerCase()}
            </span>
            {task.category && (
              <span className="text-[11px] text-subtle-fg">{task.category}</span>
            )}
            {task.dueDate && (
              <span className={cn("text-[11px] flex items-center gap-1", isOverdue ? "text-rose" : "text-muted-fg")}>
                {isOverdue ? <AlertTriangle size={10} /> : <Clock size={10} />}
                {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={confirmDelete}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); confirmDelete(e); } }}
          aria-label="Delete task"
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-subtle-fg hover:text-rose p-1.5 rounded-lg hover:bg-rose/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Delete task?"
          description={`"${task.title}" will be permanently removed.`}
          onConfirm={() => { setShowConfirm(false); handleDelete(); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
