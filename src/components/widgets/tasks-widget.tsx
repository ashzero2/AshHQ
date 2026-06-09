import { getTasks, getTaskStats } from "@/lib/services/tasks";
import { CheckSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const priorityDot: Record<string, string> = {
  LOW: "bg-subtle-fg",
  MEDIUM: "bg-sky",
  HIGH: "bg-amber-warm",
  URGENT: "bg-rose",
};

export async function TasksWidget() {
  const [tasks, stats] = await Promise.all([getTasks(), getTaskStats()]);
  const recentActive = tasks.filter((t) => t.status !== "DONE").slice(0, 5);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-subtle-fg">
        <div className="w-10 h-10 rounded-xl bg-surface-raised border border-outline flex items-center justify-center">
          <CheckSquare size={17} className="text-muted-fg" />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-fg">No tasks yet</p>
          <Link href="/tasks" className="text-[11px] text-accent hover:text-accent-light transition-colors mt-0.5 block">
            Add your first task
          </Link>
        </div>
      </div>
    );
  }

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 bg-surface-raised rounded-full h-1 overflow-hidden">
          <div
            className="h-1 rounded-full bg-emerald transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <span className="text-[11px] text-muted-fg tabular-nums">{stats.completed}/{stats.total}</span>
      </div>

      {/* Task list */}
      <div className="space-y-1.5 flex-1 min-h-0 overflow-hidden">
        {recentActive.map((task) => (
          <div key={task.id} className="flex items-center gap-2 py-0.5">
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", priorityDot[task.priority] ?? "bg-subtle-fg")} />
            <span className="text-[13px] text-muted-fg truncate leading-snug">{task.title}</span>
          </div>
        ))}
        {recentActive.length === 0 && (
          <p className="text-[12px] text-subtle-fg text-center py-3">All tasks complete!</p>
        )}
      </div>

      <Link
        href="/tasks"
        className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-light transition-colors mt-2 pt-2 border-t border-outline/60"
      >
        View all tasks →
      </Link>
    </div>
  );
}
