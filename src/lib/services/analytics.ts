"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import {
  format,
  subDays,
  startOfWeek,
  startOfMonth,
  addDays,
} from "date-fns";

export async function getHabitAnalytics() {
  await requireAuth();
  const now = new Date();
  const last30 = format(subDays(now, 29), "yyyy-MM-dd");
  const last7dates = Array.from({ length: 7 }, (_, i) =>
    format(subDays(now, 6 - i), "yyyy-MM-dd")
  );

  const habits = await prisma.habit.findMany({
    include: {
      logs: {
        where: { date: { gte: last30 } },
        orderBy: { date: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalPossible = habits.length * 7;
  const totalCompleted = habits.reduce((sum, h) => {
    return sum + h.logs.filter((l) => last7dates.includes(l.date) && l.completed).length;
  }, 0);
  const weekCompletionRate =
    totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const habitRates = habits.map((h) => {
    const completedCount = h.logs.filter((l) => l.completed).length;
    const completionRate = Math.round((completedCount / 30) * 100);
    const completedSet = new Set(h.logs.filter((l) => l.completed).map((l) => l.date));
    let streak = 0;
    let d = new Date();
    while (true) {
      const ds = format(d, "yyyy-MM-dd");
      if (completedSet.has(ds)) { streak++; d = subDays(d, 1); }
      else if (ds === format(now, "yyyy-MM-dd")) { d = subDays(d, 1); }
      else break;
    }
    return { id: h.id, name: h.name, icon: h.icon, completionRate, currentStreak: streak };
  });

  const bestStreak = habitRates.length > 0 ? Math.max(...habitRates.map((h) => h.currentStreak)) : 0;

  return { total: habits.length, weekCompletionRate, habitRates, bestStreak };
}

export async function getTaskAnalytics() {
  await requireAuth();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const tasks = await prisma.task.findMany();
  const completed = tasks.filter((t) => t.status === "DONE");
  const completedThisWeek = completed.filter(
    (t) => t.completedAt && new Date(t.completedAt) >= weekStart
  ).length;
  const completedThisMonth = completed.filter(
    (t) => t.completedAt && new Date(t.completedAt) >= monthStart
  ).length;
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
  ).length;

  const active = tasks.filter((t) => t.status !== "DONE");
  const byPriority = ["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => ({
    priority: p,
    count: active.filter((t) => t.priority === p).length,
  }));

  // Last 7 days completion trend
  const completionTrend = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i);
    const ds = format(d, "yyyy-MM-dd");
    const count = completed.filter(
      (t) => t.completedAt && format(new Date(t.completedAt), "yyyy-MM-dd") === ds
    ).length;
    return { day: format(d, "EEE"), date: ds, count };
  });

  return {
    total: tasks.length,
    completed: completed.length,
    completedThisWeek,
    completedThisMonth,
    overdue,
    byPriority,
    completionTrend,
    completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
  };
}

export async function getFinanceAnalytics() {
  await requireAuth();
  const now = new Date();
  const soon = addDays(now, 30);

  const expenses = await prisma.recurringExpense.findMany({
    where: { status: "ACTIVE" },
  });

  const totalMonthly = expenses.reduce((sum, e) => {
    if (e.frequency === "MONTHLY") return sum + e.amount * e.interval;
    if (e.frequency === "WEEKLY") return sum + (e.amount / e.interval) * 4.33;
    if (e.frequency === "YEARLY") return sum + e.amount / 12;
    return sum + e.amount;
  }, 0);

  const dueSoon = expenses.filter((e) => e.nextDueAt <= soon);
  const dueSoonTotal = dueSoon.reduce((sum, e) => sum + e.amount, 0);

  const byCat = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(byCat)
    .map(([category, amount]) => ({
      category,
      amount,
      pct: totalMonthly > 0 ? (amount / totalMonthly) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  return {
    totalActive: expenses.length,
    totalMonthly: Math.round(totalMonthly),
    dueSoonCount: dueSoon.length,
    dueSoonTotal,
    topCategories,
  };
}

export async function getPomodoroAnalytics() {
  await requireAuth();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const allSessions = await prisma.focusSession.findMany({
    where: { type: "WORK" },
    orderBy: { completedAt: "asc" },
  });

  const thisWeek = allSessions.filter((s) => new Date(s.completedAt) >= weekStart);
  const totalMinutes = allSessions.reduce((s, f) => s + f.duration, 0);
  const thisWeekMinutes = thisWeek.reduce((s, f) => s + f.duration, 0);

  const sessionDates = new Set(allSessions.map((s) => format(new Date(s.completedAt), "yyyy-MM-dd")));
  let streak = 0;
  let d = new Date();
  while (sessionDates.has(format(d, "yyyy-MM-dd"))) { streak++; d = subDays(d, 1); }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    const ds = format(day, "yyyy-MM-dd");
    return {
      day: format(day, "EEE"),
      sessions: allSessions.filter((s) => format(new Date(s.completedAt), "yyyy-MM-dd") === ds).length,
    };
  });

  return {
    totalSessions: allSessions.length,
    totalMinutes,
    thisWeekSessions: thisWeek.length,
    thisWeekMinutes,
    streak,
    last7,
  };
}
