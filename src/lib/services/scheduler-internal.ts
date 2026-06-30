// No auth imports — safe to use from instrumentation
import { prisma } from "@/lib/db";
import { processRecurringTasksDue } from "./recurring-tasks-internal";
import { processRecurringExpensesDue } from "./recurring-expenses-internal";
import { NotificationManager } from "@/lib/channels/notification-manager";
import { format, startOfDay, endOfDay, addMinutes } from "date-fns";

export async function runSchedulerInternal(): Promise<{ tasks: number; expenses: number; pending: number }> {
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

// Find tasks whose reminderAt fired in the last 15-minute window, notify, then clear the field.
export async function processTaskReminders(): Promise<number> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 15 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      status: { not: "DONE" },
      reminderAt: { gte: windowStart, lte: now },
    },
  });

  for (const task of tasks) {
    await NotificationManager.sendToAll({
      title: "⏰ Task Reminder",
      body: `${task.title}${task.dueDate ? ` — due ${format(new Date(task.dueDate), "MMM d")}` : ""}`,
      type: "TASK_REMINDER",
    }).catch(() => {});

    await prisma.task.update({
      where: { id: task.id },
      data: { reminderAt: null },
    });
  }

  return tasks.length;
}


// Notify for calendar events starting in the next 15–30 minute window.
// The 15-min cron guarantees each event falls in this window exactly once.
export async function processCalendarReminders(): Promise<number> {
  const now = new Date();
  const windowStart = addMinutes(now, 15);
  const windowEnd = addMinutes(now, 30);

  const events = await prisma.calendarEvent.findMany({
    where: { startTime: { gte: windowStart, lte: windowEnd } },
    orderBy: { startTime: "asc" },
  });

  for (const event of events) {
    const timeStr = format(new Date(event.startTime), "h:mm a");
    await NotificationManager.sendToAll({
      title: "📆 Upcoming Event",
      body: `${event.title} starts at ${timeStr}`,
      type: "INFO",
    }).catch(() => {});
  }

  return events.length;
}

// Send evening nudge for any habits not yet completed today.
export async function sendEveningHabitNudge(): Promise<void> {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const habits = await prisma.habit.findMany({
    include: { logs: { where: { date: todayStr } } },
  });

  const pending = habits.filter((h) => !h.logs.some((l) => l.completed));
  if (pending.length === 0) return;

  const names = pending.map((h) => `${h.icon} ${h.name}`).join(", ");
  await NotificationManager.sendToAll({
    title: "🌙 Habit Reminder",
    body: `Still pending: ${names}`,
    type: "INFO",
  }).catch(() => {});
}

// Send a morning briefing: overdue tasks, today's events, habit status, expenses due today.
export async function sendMorningSummary(): Promise<void> {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const [overdueTasks, habits, events, dueExpenses] = await Promise.all([
    prisma.task.findMany({
      where: { status: { not: "DONE" }, dueDate: { lt: now } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.habit.findMany({
      include: { logs: { where: { date: todayStr } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.calendarEvent.findMany({
      where: { startTime: { gte: dayStart, lte: dayEnd } },
      orderBy: { startTime: "asc" },
    }),
    prisma.recurringExpense.findMany({
      where: { status: "ACTIVE", nextDueAt: { lte: dayEnd } },
      orderBy: { nextDueAt: "asc" },
    }),
  ]);

  const lines: string[] = [`📅 <b>Morning Summary — ${format(now, "EEEE, MMM d")}</b>\n`];

  if (overdueTasks.length > 0) {
    lines.push(`🔴 <b>Overdue (${overdueTasks.length})</b>`);
    overdueTasks.forEach((t) => lines.push(`  • ${t.title}`));
    lines.push("");
  }

  if (events.length > 0) {
    lines.push(`📆 <b>Today's Events</b>`);
    events.forEach((e) =>
      lines.push(`  • ${e.title} — ${format(new Date(e.startTime), "h:mm a")}`)
    );
    lines.push("");
  }

  if (habits.length > 0) {
    const doneCount = habits.filter((h) => h.logs.some((l) => l.completed)).length;
    lines.push(`🎯 <b>Habits (${doneCount}/${habits.length} done)</b>`);
    habits.forEach((h) => {
      const done = h.logs.some((l) => l.completed);
      lines.push(`  ${done ? "✅" : "⬜"} ${h.icon} ${h.name}`);
    });
    lines.push("");
  }

  if (dueExpenses.length > 0) {
    lines.push(`💸 <b>Due Today</b>`);
    dueExpenses.forEach((e) =>
      lines.push(`  • ${e.description} — ₹${e.amount.toLocaleString("en-IN")}`)
    );
  }

  await NotificationManager.sendToAll({
    title: "",
    body: lines.join("\n"),
    type: "INFO",
  }).catch(() => {});
}
