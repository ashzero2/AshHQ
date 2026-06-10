"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { addDays, addWeeks, addMonths, addYears, setDate } from "date-fns";
import { RecurringTaskSchema, type RecurringTaskInput } from "@/lib/validations";
import type { RecurringTask, Task } from "@prisma/client";

function computeNextDue(task: RecurringTask, from: Date = new Date()): Date {
  const { frequency, interval, daysOfWeek, dayOfMonth } = task;
  switch (frequency) {
    case "DAILY":
      return addDays(from, interval);
    case "WEEKLY": {
      if (daysOfWeek) {
        const days: number[] = JSON.parse(daysOfWeek);
        if (days.length > 0) {
          let next = addDays(from, 1);
          for (let i = 0; i < 7 * interval; i++) {
            if (days.includes(next.getDay())) return next;
            next = addDays(next, 1);
          }
        }
      }
      return addWeeks(from, interval);
    }
    case "MONTHLY": {
      const next = addMonths(from, interval);
      return dayOfMonth ? setDate(next, Math.min(dayOfMonth, 28)) : next;
    }
    case "YEARLY":
      return addYears(from, interval);
    default:
      return addDays(from, interval);
  }
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
  const task = await prisma.task.create({
    data: {
      title: recurringTask.title,
      description: recurringTask.description ?? null,
      priority: recurringTask.priority,
      status: "TODO",
      dueDate: recurringTask.nextDueAt,
      recurringTaskId: recurringTask.id,
    },
  });

  const nextDue = computeNextDue(recurringTask, recurringTask.nextDueAt);
  await prisma.recurringTask.update({
    where: { id: recurringTask.id },
    data: { lastRunAt: new Date(), nextDueAt: nextDue },
  });

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
