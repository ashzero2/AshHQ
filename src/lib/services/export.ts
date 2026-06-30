"use server";

import { prisma } from "@/lib/db";

export async function exportAllData() {
  const [tasks, events, recurringExpenses, habits, habitLogs, notes, links, journal] =
    await Promise.all([
      prisma.task.findMany(),
      prisma.calendarEvent.findMany(),
      prisma.recurringExpense.findMany(),
      prisma.habit.findMany(),
      prisma.habitLog.findMany(),
      prisma.note.findMany(),
      prisma.quickLink.findMany(),
      prisma.journalEntry.findMany(),
    ]);

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: { tasks, events, recurringExpenses, habits, habitLogs, notes, links, journal },
  };
}
