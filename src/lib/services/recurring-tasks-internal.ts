// No auth imports — safe to use from instrumentation
import { prisma } from "@/lib/db";
import { addDays, addWeeks, addMonths, addYears, setDate } from "date-fns";
import type { RecurringTask } from "@prisma/client";

function applyReminderTime(date: Date, reminderTime: string | null): Date {
  if (!reminderTime) return date;
  const [h, m] = reminderTime.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h, m, 0, 0);
  return result;
}

function computeNextDue(task: RecurringTask, from: Date = new Date()): Date {
  const { frequency, interval, daysOfWeek, dayOfMonth, reminderTime } = task;
  let next: Date;
  switch (frequency) {
    case "DAILY":
      next = addDays(from, interval); break;
    case "WEEKLY": {
      if (daysOfWeek) {
        const days: number[] = JSON.parse(daysOfWeek);
        if (days.length > 0) {
          let candidate = addDays(from, 1);
          for (let i = 0; i < 7 * interval; i++) {
            if (days.includes(candidate.getDay())) { next = candidate; break; }
            candidate = addDays(candidate, 1);
          }
          next ??= addWeeks(from, interval);
          break;
        }
      }
      next = addWeeks(from, interval); break;
    }
    case "MONTHLY": {
      const m = addMonths(from, interval);
      next = dayOfMonth ? setDate(m, Math.min(dayOfMonth, 28)) : m; break;
    }
    case "YEARLY":
      next = addYears(from, interval); break;
    default:
      next = addDays(from, interval);
  }
  return applyReminderTime(next, reminderTime);
}

export async function processRecurringTasksDue(): Promise<number> {
  const now = new Date();
  const dueTasks = await prisma.recurringTask.findMany({
    where: { status: "ACTIVE", nextDueAt: { lte: now } },
  });

  for (const rt of dueTasks) {
    const nextDue = computeNextDue(rt, rt.nextDueAt);
    await prisma.$transaction([
      prisma.task.create({
        data: {
          title: rt.title,
          description: rt.description ?? null,
          priority: rt.priority,
          status: "TODO",
          dueDate: rt.nextDueAt,
          recurringTaskId: rt.id,
        },
      }),
      prisma.recurringTask.update({
        where: { id: rt.id },
        data: { lastRunAt: new Date(), nextDueAt: nextDue },
      }),
    ]);
  }

  return dueTasks.length;
}
