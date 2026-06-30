"use client";

import { useState, useTransition } from "react";
import { updateTask, deleteTask, toggleSubtask } from "@/lib/services/tasks";
import { cn } from "@/lib/utils";
import { Check, Trash2, Clock, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Task, Subtask } from "@prisma/client";

const priorityStyles: Record<string, { dot: string; badge: string }> = {
  LOW: { dot: "bg-subtle-fg", badge: "text-muted-fg bg-surface-raised" },
  MEDIUM: { dot: "bg-sky", badge: "text-sky bg-sky/10" },
  HIGH: { dot: "bg-amber-warm", badge: "text-amber-warm bg-amber-warm/10" },
  URGENT: { dot: "bg-rose", badge: "text-rose bg-rose/10" },
};

interface TaskCardProps {
  task: Task & { subtasks: Subtask[] };
  onEdit: (task: Task & { subtasks: Subtask[] }) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const isDone = task.status === "DONE";
  const hasSubtasks = task.subtasks.length > 0;
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

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

  const handleSubtaskToggle = (e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation();
    startTransition(async () => {
      await toggleSubtask(subtaskId);
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
          "group flex flex-col gap-0 rounded-xl border bg-surface cursor-pointer transition-all",
          "hover:border-outline-strong hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          isDone ? "border-outline/40 opacity-60" : "border-outline",
          isPending && "opacity-40 pointer-events-none"
        )}
      >
        <div className="flex items-start gap-3 p-3.5">
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
              {hasSubtasks && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSubtasksOpen((o) => !o); }}
                  className="text-[11px] text-muted-fg hover:text-foreground flex items-center gap-0.5 transition-colors"
                >
                  {subtasksOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                  {completedSubtasks}/{task.subtasks.length}
                </button>
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

        {/* Inline subtask checklist */}
        {hasSubtasks && subtasksOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="px-3.5 pb-3 space-y-1.5 border-t border-outline/50 pt-2.5"
          >
            {task.subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2">
                <button
                  onClick={(e) => handleSubtaskToggle(e, sub.id)}
                  className={cn(
                    "flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all",
                    sub.completed ? "bg-emerald border-emerald" : "border-outline-strong hover:border-accent"
                  )}
                  aria-label={sub.completed ? "Uncheck subtask" : "Check subtask"}
                >
                  {sub.completed && <Check size={9} className="text-background" />}
                </button>
                <span className={cn("text-[12px]", sub.completed ? "line-through text-muted-fg" : "text-foreground")}>
                  {sub.title}
                </span>
              </div>
            ))}
          </div>
        )}
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
