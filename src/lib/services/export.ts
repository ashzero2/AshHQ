"use server";

import { prisma } from "@/lib/db";

export async function exportAllData() {
  const [tasks, events, transactions, budgets, habits, habitLogs, notes, links, journal] =
    await Promise.all([
      prisma.task.findMany(),
      prisma.calendarEvent.findMany(),
      prisma.transaction.findMany(),
      prisma.budget.findMany(),
      prisma.habit.findMany(),
      prisma.habitLog.findMany(),
      prisma.note.findMany(),
      prisma.quickLink.findMany(),
      prisma.journalEntry.findMany(),
    ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { tasks, events, transactions, budgets, habits, habitLogs, notes, links, journal },
  };
}
