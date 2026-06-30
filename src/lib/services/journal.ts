"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { sanitizeRichText } from "@/lib/sanitize";

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

export async function upsertJournalEntry(data: {
  date: string;
  content: string;
  mood?: string | null;
  contentType?: string;
}) {
  await requireAuth();
  const ct = data.contentType ?? "richtext";
  const content = ct === "richtext" ? sanitizeRichText(data.content) : data.content;
  const entry = await prisma.journalEntry.upsert({
    where: { date: data.date },
    update: { content, mood: data.mood ?? null, contentType: ct },
    create: { date: data.date, content, mood: data.mood ?? null, contentType: ct },
  });
  revalidatePath("/journal");
  return entry;
}

export async function deleteJournalEntry(id: string) {
  await requireAuth();
  await prisma.journalEntry.delete({ where: { id } });
  revalidatePath("/journal");
}
