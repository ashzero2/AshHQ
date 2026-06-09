"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function createFocusSession(data: { duration: number; type: string; taskId?: string | null }) {
  await requireAuth();
  const session = await prisma.focusSession.create({
    data: {
      duration: data.duration,
      type: data.type,
      taskId: data.taskId ?? null,
      completedAt: new Date(),
    },
  });
  revalidatePath("/");
  return session;
}

export async function getFocusStats(days = 7) {
  await requireAuth();
  const since = subDays(new Date(), days);
  const sessions = await prisma.focusSession.findMany({
    where: { completedAt: { gte: since }, type: "WORK" },
    orderBy: { completedAt: "asc" },
  });

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const todaySessions = sessions.filter(
    (s) => s.completedAt >= todayStart && s.completedAt <= todayEnd
  );

  return {
    total: sessions.length,
    todayCount: todaySessions.length,
    todayMinutes: todaySessions.reduce((s, x) => s + x.duration, 0),
    totalMinutes: sessions.reduce((s, x) => s + x.duration, 0),
  };
}
