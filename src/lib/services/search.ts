"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export interface SearchResult {
  id: string;
  type: "task" | "note" | "journal";
  title: string;
  subtitle: string;
  url: string;
}

export async function searchContent(query: string): Promise<SearchResult[]> {
  await requireAuth();
  const q = query.trim();
  if (q.length < 2) return [];

  const [tasks, notes, journal] = await Promise.all([
    prisma.task.findMany({
      where: {
        status: { not: "DONE" },
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      },
      take: 5,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    }),
    prisma.note.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      take: 5,
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.journalEntry.findMany({
      where: { content: { contains: q } },
      take: 3,
      orderBy: { date: "desc" },
    }),
  ]);

  const results: SearchResult[] = [
    ...tasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      title: t.title,
      subtitle: `${t.priority} · ${t.status.replace("_", " ")}`,
      url: "/tasks",
    })),
    ...notes.map((n) => ({
      id: n.id,
      type: "note" as const,
      title: n.title,
      subtitle: n.content
        ? n.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60)
        : "Empty note",
      url: "/notes",
    })),
    ...journal.map((j) => ({
      id: j.id,
      type: "journal" as const,
      title: `Journal — ${j.date}`,
      subtitle: j.content
        ? j.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60)
        : "Empty entry",
      url: `/journal`,
    })),
  ];

  return results;
}
