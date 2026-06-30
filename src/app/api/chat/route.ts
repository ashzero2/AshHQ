import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSessionToken } from "@/lib/services/auth";
import { format, addDays } from "date-fns";
import { cookies } from "next/headers";

async function buildContextPrompt(): Promise<string> {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const [tasks, events, habits, bills, notes] = await Promise.all([
    prisma.task.findMany({
      where: { status: { not: "DONE" } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
    prisma.calendarEvent.findMany({
      where: { startTime: { gte: today } },
      orderBy: { startTime: "asc" },
      take: 15,
    }),
    prisma.habit.findMany({
      include: { logs: { where: { date: todayStr } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.recurringExpense.findMany({
      where: { status: "ACTIVE", nextDueAt: { lte: addDays(today, 7) } },
      orderBy: { nextDueAt: "asc" },
      take: 10,
    }),
    prisma.note.findMany({
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: 10,
    }),
  ]);

  const taskLines = tasks.length
    ? tasks.map((t) => `  - [${t.priority}] ${t.title} (${t.status})${t.dueDate ? ` — due ${format(new Date(t.dueDate), "MMM d")}` : ""}`).join("\n")
    : "  (none)";

  const eventLines = events.length
    ? events.slice(0, 10).map((e) => `  - ${e.title} — ${format(new Date(e.startTime), "MMM d, h:mm a")}`).join("\n")
    : "  (none)";

  const habitLines = habits.length
    ? habits.map((h) => `  - ${h.icon} ${h.name}: ${h.logs.length > 0 ? "✅ done" : "⬜ not done"}`).join("\n")
    : "  (none)";

  const billLines = bills.length
    ? bills.map((b) => {
        const diff = Math.ceil((new Date(b.nextDueAt).getTime() - today.getTime()) / 86400000);
        const when = diff <= 0 ? "due today" : `in ${diff}d`;
        return `  - ${b.description}: ₹${b.amount.toLocaleString("en-IN")} (${when})`;
      }).join("\n")
    : "  (none due soon)";

  const noteLines = notes.length
    ? notes.map((n) => `  - "${n.title}"${n.pinned ? " 📌" : ""}${n.content ? `: ${n.content.slice(0, 80)}${n.content.length > 80 ? "…" : ""}` : ""}`).join("\n")
    : "  (none)";

  return `You are AshHQ — a private workspace assistant with access to the user's live data. Be helpful, concise, and actionable. Use markdown for formatting.

TODAY: ${format(today, "EEEE, MMMM d, yyyy")}

ACTIVE TASKS (${tasks.length}):
${taskLines}

UPCOMING EVENTS (${events.length}):
${eventLines}

TODAY'S HABITS (${habits.length} total):
${habitLines}

BILLS DUE SOON (${bills.length}):
${billLines}

RECENT NOTES (${notes.length}):
${noteLines}`;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("ashhq-session")?.value ?? "";
  if (!await validateSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = await req.json();
  const settings = await prisma.settings.findFirst();
  const provider = settings?.aiProvider || "OPENAI";

  const [systemPrompt] = await Promise.all([buildContextPrompt()]);

  let model;
  if (provider === "GEMINI") {
    const google = createGoogleGenerativeAI({
      apiKey: settings?.geminiApiKey || process.env.GEMINI_API_KEY || "",
    });
    model = google(settings?.geminiModel || "gemini-2.0-flash");
  } else if (provider === "OLLAMA") {
    const ollama = createOpenAICompatible({
      name: "ollama",
      baseURL: (settings?.ollamaBaseUrl || "http://localhost:11434") + "/v1",
    });
    model = ollama(settings?.ollamaModel || "llama3.2");
  } else {
    const openai = createOpenAI({
      apiKey: settings?.openaiApiKey || process.env.OPENAI_API_KEY || "",
    });
    model = openai(settings?.openaiModel || "gpt-4o-mini");
  }

  const result = await streamText({ model, system: systemPrompt, messages });
  return result.toTextStreamResponse();
}
