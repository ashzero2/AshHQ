"use client";

import { useTransition } from "react";
import { updateTask, deleteTask } from "@/lib/services/tasks";
import { cn } from "@/lib/utils";
import { Check, Trash2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Task } from "@prisma/client";

const priorityColors: Record<string, string> = {
  LOW: "text-zinc-500",
  MEDIUM: "text-blue-400",
  HIGH: "text-orange-400",
  URGENT: "text-red-400",
};

const priorityBg: Record<string, string> = {
  LOW: "bg-zinc-500/10",
  MEDIUM: "bg-blue-500/10",
  HIGH: "bg-orange-500/10",
  URGENT: "bg-red-500/10",
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "DONE";

  const handleToggle = () => {
    startTransition(async () => {
      await updateTask({
        id: task.id,
        status: isDone ? "TODO" : "DONE",
      });
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await deleteTask(task.id);
      toast.success("Task deleted");
    });
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

  return (
    <div
      onClick={() => onEdit(task)}
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50 cursor-pointer transition-all",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className={cn(
          "flex-shrink-0 w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all",
          isDone
            ? "bg-green-500 border-green-500"
            : "border-zinc-600 hover:border-blue-500"
        )}
      >
        {isDone && <Check size={12} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isDone && "line-through text-zinc-500"
          )}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Priority badge */}
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              priorityColors[task.priority],
              priorityBg[task.priority]
            )}
          >
            {task.priority.toLowerCase()}
          </span>

          {/* Category */}
          {task.category && (
            <span className="text-xs text-zinc-500">{task.category}</span>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "text-xs flex items-center gap-1",
                isOverdue ? "text-red-400" : "text-zinc-500"
              )}
            >
              {isOverdue ? (
                <AlertTriangle size={10} />
              ) : (
                <Clock size={10} />
              )}
              {formatDistanceToNow(new Date(task.dueDate), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-1"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
