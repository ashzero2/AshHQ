"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function getJournalEntries(limit = 30) {
  return prisma.journalEntry.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getJournalByDate(date: string) {
  return prisma.journalEntry.findUnique({ where: { date } });
}

export async function upsertJournalEntry(data: { date: string; content: string; mood?: string | null }) {
  const entry = await prisma.journalEntry.upsert({
    where: { date: data.date },
    update: { content: data.content, mood: data.mood ?? null },
    create: { date: data.date, content: data.content, mood: data.mood ?? null },
  });
  revalidatePath("/journal");
  return entry;
}

export async function deleteJournalEntry(id: string) {
  await prisma.journalEntry.delete({ where: { id } });
  revalidatePath("/journal");
}

