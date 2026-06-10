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
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-fg mt-0.5">Track what needs to get done</p>
        </div>
        <TaskList tasks={tasks} recurringTasks={recurringTasks} />
      </div>
    </AppShell>
  );
}
