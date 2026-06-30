import { processRecurringTasksDue } from "./recurring-tasks";
import { processRecurringExpensesDue } from "./recurring-expenses";
import { NotificationManager } from "@/lib/channels/notification-manager";

export async function runScheduler(): Promise<{ tasks: number; expenses: number; pending: number }> {
  const [tasks, expResult] = await Promise.all([
    processRecurringTasksDue(),
    processRecurringExpensesDue(),
  ]);
  const { autoRecorded, pendingItems } = expResult;

  const parts: string[] = [];
  if (tasks > 0) parts.push(`${tasks} task${tasks === 1 ? "" : "s"} spawned`);
  if (autoRecorded > 0) parts.push(`${autoRecorded} expense${autoRecorded === 1 ? "" : "s"} recorded`);

  if (parts.length > 0) {
    await NotificationManager.sendToAll({
      title: "Recurring Items",
      body: parts.join(" · "),
      type: "TASK_REMINDER",
    }).catch(() => {});
  }

  for (const item of pendingItems) {
    await NotificationManager.sendActionableToAll({
      title: `💸 ${item.description}`,
      body: `₹${item.amount.toLocaleString("en-IN")} · ${item.category} — due today`,
      type: "EXPENSE_DUE",
      actions: [
        { label: "✅ Record", callbackData: `approve:expense:${item.id}` },
        { label: "⏰ Snooze 7d", callbackData: `snooze:expense:${item.id}` },
      ],
    }).catch(() => {});
  }

  return { tasks, expenses: autoRecorded, pending: pendingItems.length };
}
