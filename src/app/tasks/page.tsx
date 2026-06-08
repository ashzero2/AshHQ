import { AppShell } from "@/components/layout/app-shell";
import { TaskList } from "@/components/features/tasks/task-list";
import { getTasks } from "@/lib/services/tasks";

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Tasks</h1>
        <TaskList tasks={tasks} />
      </div>
    </AppShell>
  );
}
