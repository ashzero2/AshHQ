"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export async function getJournalEntries(limit = 30) {
  await requireAuth();
  return prisma.journalEntry.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getJournalByDate(date: string) {
  await requireAuth();
  return prisma.journalEntry.findUnique({ where: { date } });
}

export async function upsertJournalEntry(data: { date: string; content: string; mood?: string | null }) {
  await requireAuth();
  const entry = await prisma.journalEntry.upsert({
    where: { date: data.date },
    update: { content: data.content, mood: data.mood ?? null },
    create: { date: data.date, content: data.content, mood: data.mood ?? null },
  });
  revalidatePath("/journal");
  return entry;
}

export async function deleteJournalEntry(id: string) {
  await requireAuth();
  await prisma.journalEntry.delete({ where: { id } });
  revalidatePath("/journal");
}
