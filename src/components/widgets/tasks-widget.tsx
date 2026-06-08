import { getTasks, getTaskStats } from "@/lib/services/tasks";
import { CheckSquare, Plus, Circle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export async function TasksWidget() {
  const [tasks, stats] = await Promise.all([getTasks(), getTaskStats()]);
  const recentActive = tasks
    .filter((t) => t.status !== "DONE")
    .slice(0, 4);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <CheckSquare size={24} className="mb-2" />
        <p className="text-sm">No tasks yet</p>
        <Link href="/tasks" className="text-blue-400 text-xs mt-1 hover:underline">
          Add your first task
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stats row */}
      <div className="flex gap-3 mb-3 text-xs">
        <span className="text-blue-400">{stats.total} total</span>
        <span className="text-green-400">{stats.completed} done</span>
        {stats.overdue > 0 && (
          <span className="text-red-400 flex items-center gap-1">
            <AlertTriangle size={10} />
            {stats.overdue} overdue
          </span>
        )}
      </div>

      {/* Recent tasks */}
      <div className="space-y-1.5 flex-1">
        {recentActive.map((task) => (
          <div key={task.id} className="flex items-center gap-2 text-sm">
            <Circle size={8} className={
              task.priority === "URGENT" ? "text-red-400" :
              task.priority === "HIGH" ? "text-orange-400" :
              task.priority === "MEDIUM" ? "text-blue-400" : "text-zinc-500"
            } />
            <span className="truncate text-zinc-300">{task.title}</span>
          </div>
        ))}
      </div>

      {/* Link to full page */}
      <Link
        href="/tasks"
        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 pt-2 border-t border-zinc-800"
      >
        <Plus size={12} />
        View all tasks
      </Link>
    </div>
  );
}
