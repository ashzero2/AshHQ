"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { addDays, addWeeks, addMonths, addYears, setDate } from "date-fns";
import { RecurringExpenseSchema, type RecurringExpenseInput } from "@/lib/validations";
import type { RecurringExpense, Transaction } from "@prisma/client";

function computeNextDue(expense: RecurringExpense, from: Date = new Date()): Date {
  const { frequency, interval, dayOfMonth } = expense;
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
  return next;
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

  const expense = await prisma.recurringExpense.create({
    data: {
      description: parsed.description,
      amount: parsed.amount,
      category: parsed.category,
      frequency: parsed.frequency,
      interval: parsed.interval,
      dayOfMonth: parsed.dayOfMonth ?? null,
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
  const exp = await prisma.recurringExpense.findUniqueOrThrow({ where: { id: recurringExpenseId } });

  const tx = await prisma.transaction.create({
    data: {
      amount: exp.amount,
      type: "EXPENSE",
      category: exp.category,
      description: exp.description,
      date: new Date(),
    },
  });

  const nextDue = computeNextDue(exp);
  await prisma.recurringExpense.update({
    where: { id: recurringExpenseId },
    data: { lastPaidAt: new Date(), nextDueAt: nextDue },
  });

  revalidatePath("/finance");
  return tx;
}

export async function snoozeExpense(recurringExpenseId: string, days: number): Promise<void> {
  await requireAuth();
  const exp = await prisma.recurringExpense.findUniqueOrThrow({ where: { id: recurringExpenseId } });
  await prisma.recurringExpense.update({
    where: { id: recurringExpenseId },
    data: { nextDueAt: addDays(exp.nextDueAt, days) },
  });
  revalidatePath("/finance");
}

export async function processRecurringExpensesDue(): Promise<number> {
  const now = new Date();
  const due = await prisma.recurringExpense.findMany({
    where: { status: "ACTIVE", autoApprove: true, nextDueAt: { lte: now } },
  });

  for (const exp of due) {
    await prisma.transaction.create({
      data: {
        amount: exp.amount,
        type: "EXPENSE",
        category: exp.category,
        description: exp.description,
        date: new Date(),
      },
    });
    const nextDue = computeNextDue(exp);
    await prisma.recurringExpense.update({
      where: { id: exp.id },
      data: { lastPaidAt: new Date(), nextDueAt: nextDue },
    });
  }

  return due.length;
}
