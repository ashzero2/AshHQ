"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { addDays, addWeeks, addMonths, addYears, setDate } from "date-fns";
import { RecurringExpenseSchema, type RecurringExpenseInput } from "@/lib/validations";
import type { RecurringExpense, Transaction } from "@prisma/client";
import { approveExpenseInternal, snoozeExpenseInternal } from "./recurring-expenses-internal";
export { approveExpenseInternal, snoozeExpenseInternal };

function applyReminderTime(date: Date, reminderTime: string | null): Date {
  if (!reminderTime) return date;
  const [h, m] = reminderTime.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h, m, 0, 0);
  return result;
}

function computeNextDue(expense: RecurringExpense, from: Date = new Date()): Date {
  const { frequency, interval, dayOfMonth, reminderTime } = expense;
  let next: Date;
  switch (frequency) {
    case "WEEKLY":  next = addWeeks(from, interval); break;
    case "MONTHLY": next = addMonths(from, interval); break;
    case "YEARLY":  next = addYears(from, interval); break;
    default:        next = addDays(from, interval);
  }
  if (dayOfMonth && (frequency === "MONTHLY" || frequency === "YEARLY")) {
    next = setDate(next, Math.min(dayOfMonth, 28));
  }
  return applyReminderTime(next, reminderTime);
}

export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  await requireAuth();
  return prisma.recurringExpense.findMany({ orderBy: { nextDueAt: "asc" } });
}

export async function createRecurringExpense(data: RecurringExpenseInput): Promise<RecurringExpense> {
  await requireAuth();
  const parsed = RecurringExpenseSchema.parse(data);

  // Compute first nextDueAt: if dayOfMonth set, use it for current/next month
  let nextDueAt = new Date();
  if (parsed.dayOfMonth) {
    nextDueAt.setDate(parsed.dayOfMonth);
    if (nextDueAt < new Date()) nextDueAt = addMonths(nextDueAt, 1);
  }
  if (parsed.reminderTime) {
    const [h, m] = parsed.reminderTime.split(":").map(Number);
    nextDueAt.setHours(h, m, 0, 0);
  }

  const expense = await prisma.recurringExpense.create({
    data: {
      description: parsed.description,
      amount: parsed.amount,
      category: parsed.category,
      frequency: parsed.frequency,
      interval: parsed.interval,
      dayOfMonth: parsed.dayOfMonth ?? null,
      reminderTime: parsed.reminderTime ?? null,
      autoApprove: parsed.autoApprove,
      nextDueAt,
      status: "ACTIVE",
    },
  });
  revalidatePath("/finance");
  return expense;
}

export async function updateRecurringExpense(
  id: string,
  data: Partial<RecurringExpenseInput>
): Promise<RecurringExpense> {
  await requireAuth();
  const expense = await prisma.recurringExpense.update({
    where: { id },
    data: {
      ...(data.description !== undefined && { description: data.description }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.interval !== undefined && { interval: data.interval }),
      ...(data.dayOfMonth !== undefined && { dayOfMonth: data.dayOfMonth ?? null }),
      ...(data.reminderTime !== undefined && { reminderTime: data.reminderTime ?? null }),
      ...(data.autoApprove !== undefined && { autoApprove: data.autoApprove }),
    },
  });
  revalidatePath("/finance");
  return expense;
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  await requireAuth();
  await prisma.recurringExpense.delete({ where: { id } });
  revalidatePath("/finance");
}

export async function pauseRecurringExpense(id: string): Promise<RecurringExpense> {
  await requireAuth();
  const exp = await prisma.recurringExpense.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.recurringExpense.update({
    where: { id },
    data: { status: exp.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
  });
  revalidatePath("/finance");
  return updated;
}

export async function approveExpense(recurringExpenseId: string): Promise<Transaction> {
  await requireAuth();
  const { transaction } = await approveExpenseInternal(recurringExpenseId);
  revalidatePath("/finance");
  return transaction;
}

export async function snoozeExpense(recurringExpenseId: string, days: number): Promise<void> {
  await requireAuth();
  await snoozeExpenseInternal(recurringExpenseId, days);
  revalidatePath("/finance");
}

export async function processRecurringExpensesDue(): Promise<{ autoRecorded: number; pendingItems: RecurringExpense[] }> {
  const now = new Date();
  const due = await prisma.recurringExpense.findMany({
    where: { status: "ACTIVE", nextDueAt: { lte: now } },
  });

  const pending = due.filter((e) => !e.autoApprove);
  const autoApprove = due.filter((e) => e.autoApprove);

  for (const exp of autoApprove) {
    const nextDue = computeNextDue(exp, exp.nextDueAt);
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          amount: exp.amount,
          type: "EXPENSE",
          category: exp.category,
          description: exp.description,
          date: new Date(),
        },
      }),
      prisma.recurringExpense.update({
        where: { id: exp.id },
        data: { lastPaidAt: new Date(), nextDueAt: nextDue },
      }),
    ]);
  }

  return { autoRecorded: autoApprove.length, pendingItems: pending };
}
