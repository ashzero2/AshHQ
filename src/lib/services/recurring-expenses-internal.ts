// No auth imports — safe to use from instrumentation
import { prisma } from "@/lib/db";
import { addDays, addWeeks, addMonths, addYears, setDate } from "date-fns";
import type { RecurringExpense } from "@prisma/client";

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

export async function approveExpenseInternal(recurringExpenseId: string): Promise<{ amount: number }> {
  const exp = await prisma.recurringExpense.findUniqueOrThrow({ where: { id: recurringExpenseId } });
  const nextDue = computeNextDue(exp, exp.nextDueAt);
  await prisma.recurringExpense.update({
    where: { id: recurringExpenseId },
    data: { lastPaidAt: new Date(), nextDueAt: nextDue },
  });
  return { amount: exp.amount };
}

export async function snoozeExpenseInternal(recurringExpenseId: string, days: number): Promise<void> {
  const exp = await prisma.recurringExpense.findUniqueOrThrow({ where: { id: recurringExpenseId } });
  await prisma.recurringExpense.update({
    where: { id: recurringExpenseId },
    data: { nextDueAt: addDays(exp.nextDueAt, days) },
  });
}

export async function processRecurringExpensesDue(): Promise<{ autoRecorded: number; pendingItems: RecurringExpense[] }> {
  const now = new Date();
  const due = await prisma.recurringExpense.findMany({
    where: { status: "ACTIVE", nextDueAt: { lte: now } },
  });

  const pending = due.filter((e) => !e.autoApprove);
  const auto = due.filter((e) => e.autoApprove);

  for (const exp of auto) {
    const nextDue = computeNextDue(exp, exp.nextDueAt);
    await prisma.recurringExpense.update({
      where: { id: exp.id },
      data: { lastPaidAt: new Date(), nextDueAt: nextDue },
    });
  }

  return { autoRecorded: auto.length, pendingItems: pending };
}
