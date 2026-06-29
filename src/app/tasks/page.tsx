export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { TaskList } from "@/components/features/tasks/task-list";
import { getTasks } from "@/lib/services/tasks";
import { getRecurringTasks } from "@/lib/services/recurring-tasks";

export default async function TasksPage() {
  const [tasks, recurringTasks] = await Promise.all([getTasks(), getRecurringTasks()]);
  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-6 flex-shrink-0 border-b border-outline/70 pb-5">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-fg mt-1">Open work, recurring items, and completed tasks.</p>
        </div>
        <TaskList tasks={tasks} recurringTasks={recurringTasks} />
      </div>
    </AppShell>
  );
}
