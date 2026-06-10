import { processRecurringTasksDue } from "./recurring-tasks";
import { processRecurringExpensesDue } from "./recurring-expenses";
import { NotificationManager } from "@/lib/channels/notification-manager";

export async function runScheduler(): Promise<{ tasks: number; expenses: number }> {
  const [tasks, expenses] = await Promise.all([
    processRecurringTasksDue(),
    processRecurringExpensesDue(),
  ]);

  if (tasks > 0) {
    await NotificationManager.sendToAll({
      title: "Recurring Tasks",
      body: `${tasks} recurring task${tasks === 1 ? "" : "s"} spawned`,
      type: "TASK_REMINDER",
    }).catch(() => {});
  }

  return { tasks, expenses };
}
