import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSessionToken } from "@/lib/services/auth";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { cookies } from "next/headers";

async function buildContextPrompt(): Promise<string> {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [tasks, events, habits, transactions, notes] = await Promise.all([
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
    prisma.transaction.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.note.findMany({
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: 10,
    }),
  ]);

  const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  const taskLines = tasks.length
    ? tasks.map((t) => `  - [${t.priority}] ${t.title} (${t.status})${t.dueDate ? ` — due ${format(new Date(t.dueDate), "MMM d")}` : ""}`).join("\n")
    : "  (none)";

  const eventLines = events.length
    ? events.slice(0, 10).map((e) => `  - ${e.title} — ${format(new Date(e.startTime), "MMM d, h:mm a")}`).join("\n")
    : "  (none)";

  const habitLines = habits.length
    ? habits.map((h) => `  - ${h.icon} ${h.name}: ${h.logs.length > 0 ? "✅ done" : "⬜ not done"}`).join("\n")
    : "  (none)";

  const noteLines = notes.length
    ? notes.map((n) => `  - "${n.title}"${n.pinned ? " 📌" : ""}${n.content ? `: ${n.content.slice(0, 80)}${n.content.length > 80 ? "…" : ""}` : ""}`).join("\n")
    : "  (none)";

  return `You are AshHQ — a personal AI assistant with full access to the user's live data. Be helpful, concise, and actionable. Use markdown for formatting.

TODAY: ${format(today, "EEEE, MMMM d, yyyy")}

ACTIVE TASKS (${tasks.length}):
${taskLines}

UPCOMING EVENTS (${events.length}):
${eventLines}

TODAY'S HABITS (${habits.length} total):
${habitLines}

FINANCE THIS MONTH:
  Income: ${income.toLocaleString("en-IN", { style: "currency", currency: "INR" })} | Expenses: ${expenses.toLocaleString("en-IN", { style: "currency", currency: "INR" })} | Balance: ${(income - expenses).toLocaleString("en-IN", { style: "currency", currency: "INR" })}

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
