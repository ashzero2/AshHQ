"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { CreateHabitSchema } from "@/lib/validations";
import type { CreateHabitInput } from "@/lib/validations";
import { format, subDays, eachDayOfInterval } from "date-fns";

export async function getHabits() {
  const habits = await prisma.habit.findMany({
    include: {
      logs: {
        where: {
          date: {
            gte: format(subDays(new Date(), 365), "yyyy-MM-dd"),
          },
        },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const today = format(new Date(), "yyyy-MM-dd");

  return habits.map((habit) => {
    const todayLog = habit.logs.find((l) => l.date === today);
    const streak = calculateCurrentStreak(habit.logs);
    const longestStreak = calculateLongestStreak(habit.logs);

    return {
      ...habit,
      todayCompleted: !!todayLog?.completed,
      currentStreak: streak,
      longestStreak,
    };
  });
}

function calculateCurrentStreak(logs: { date: string; completed: boolean }[]) {
  const completedDates = new Set(
    logs.filter((l) => l.completed).map((l) => l.date)
  );

  let streak = 0;
  let d = new Date();
  while (true) {
    const dateStr = format(d, "yyyy-MM-dd");
    if (completedDates.has(dateStr)) {
      streak++;
      d = subDays(d, 1);
    } else if (dateStr === format(new Date(), "yyyy-MM-dd")) {
      d = subDays(d, 1);
    } else {
      break;
    }
  }
  return streak;
}

function calculateLongestStreak(logs: { date: string; completed: boolean }[]) {
  const completedDates = logs
    .filter((l) => l.completed)
    .map((l) => l.date)
    .sort();

  if (completedDates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1]);
    const curr = new Date(completedDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

export async function createHabit(data: CreateHabitInput) {
  const parsed = CreateHabitSchema.parse(data);
  const habit = await prisma.habit.create({ data: parsed });
  revalidatePath("/");
  revalidatePath("/habits");
  return habit;
}

export async function deleteHabit(id: string) {
  await prisma.habit.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/habits");
}

export async function toggleHabitLog(habitId: string, date: string) {
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date } },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitLog.create({
      data: { habitId, date, completed: true },
    });
  }

  revalidatePath("/");
  revalidatePath("/habits");
}
