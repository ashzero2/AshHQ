"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { addDays, addWeeks, addMonths, addYears, setDate } from "date-fns";
import { RecurringTaskSchema, type RecurringTaskInput } from "@/lib/validations";
import type { RecurringTask, Task } from "@prisma/client";

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

export async function getRecurringTasks(): Promise<RecurringTask[]> {
  await requireAuth();
  return prisma.recurringTask.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createRecurringTask(data: RecurringTaskInput): Promise<RecurringTask> {
  await requireAuth();
  const parsed = RecurringTaskSchema.parse(data);
  const task = await prisma.recurringTask.create({
    data: {
      title: parsed.title,
      description: parsed.description ?? null,
      priority: parsed.priority,
      frequency: parsed.frequency,
      interval: parsed.interval,
      daysOfWeek: parsed.daysOfWeek ? JSON.stringify(parsed.daysOfWeek) : null,
      dayOfMonth: parsed.dayOfMonth ?? null,
      cronExpr: parsed.cronExpr ?? null,
      reminderTime: parsed.reminderTime ?? null,
      nextDueAt: parsed.nextDueAt,
      status: "ACTIVE",
    },
  });
  revalidatePath("/tasks");
  return task;
}

export async function updateRecurringTask(
  id: string,
  data: Partial<RecurringTaskInput>
): Promise<RecurringTask> {
  await requireAuth();
  const task = await prisma.recurringTask.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description ?? null }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.interval !== undefined && { interval: data.interval }),
      ...(data.daysOfWeek !== undefined && { daysOfWeek: data.daysOfWeek ? JSON.stringify(data.daysOfWeek) : null }),
      ...(data.dayOfMonth !== undefined && { dayOfMonth: data.dayOfMonth ?? null }),
      ...(data.cronExpr !== undefined && { cronExpr: data.cronExpr ?? null }),
      ...(data.reminderTime !== undefined && { reminderTime: data.reminderTime ?? null }),
      ...(data.nextDueAt !== undefined && { nextDueAt: data.nextDueAt }),
    },
  });
  revalidatePath("/tasks");
  return task;
}

export async function deleteRecurringTask(id: string): Promise<void> {
  await requireAuth();
  await prisma.recurringTask.delete({ where: { id } });
  revalidatePath("/tasks");
}

export async function pauseRecurringTask(id: string): Promise<RecurringTask> {
  await requireAuth();
  const task = await prisma.recurringTask.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.recurringTask.update({
    where: { id },
    data: { status: task.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
  });
  revalidatePath("/tasks");
  return updated;
}

export async function spawnTaskInstance(recurringTask: RecurringTask): Promise<Task> {
  const nextDue = computeNextDue(recurringTask, recurringTask.nextDueAt);
  const [task] = await prisma.$transaction([
    prisma.task.create({
      data: {
        title: recurringTask.title,
        description: recurringTask.description ?? null,
        priority: recurringTask.priority,
        status: "TODO",
        dueDate: recurringTask.nextDueAt,
        recurringTaskId: recurringTask.id,
      },
    }),
    prisma.recurringTask.update({
      where: { id: recurringTask.id },
      data: { lastRunAt: new Date(), nextDueAt: nextDue },
    }),
  ]);
  return task;
}

export async function processRecurringTasksDue(): Promise<number> {
  const now = new Date();
  const dueTasks = await prisma.recurringTask.findMany({
    where: { status: "ACTIVE", nextDueAt: { lte: now } },
  });

  for (const rt of dueTasks) {
    await spawnTaskInstance(rt);
  }

  return dueTasks.length;
}
