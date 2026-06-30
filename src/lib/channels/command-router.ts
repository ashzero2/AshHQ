import { prisma } from "@/lib/db";
import { format, addDays } from "date-fns";

export interface CommandResult {
  text: string;
}

export async function executeCommand(command: string, args: string): Promise<CommandResult> {
  switch (command) {
    case "start":
    case "help":
      return {
        text:
          "🏠 <b>AshHQ Commands</b>\n\n" +
          "/tasks — pending tasks\n" +
          "/overdue — overdue tasks\n" +
          "/habits — today's habits\n" +
          "/finance — upcoming recurring bills\n" +
          "/upcoming — next 5 calendar events\n" +
          "/weather — current weather\n" +
          "/summary — full daily briefing\n" +
          "/addtask [title] [--low|--high|--urgent] — create a task\n" +
          "/done [partial name] — mark a task as done\n" +
          "/addnote [title] — create a note\n",
      };

    case "tasks": {
      const tasks = await prisma.task.findMany({
        where: { status: { not: "DONE" } },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: 10,
      });
      return {
        text:
          tasks.length === 0
            ? "✅ No pending tasks!"
            : `📋 <b>Pending Tasks (${tasks.length})</b>\n\n` +
              tasks.map((t) => `• ${t.title} [${t.priority}]`).join("\n"),
      };
    }

    case "overdue": {
      const now = new Date();
      const tasks = await prisma.task.findMany({
        where: { status: { not: "DONE" }, dueDate: { lt: now } },
        orderBy: { dueDate: "asc" },
        take: 10,
      });
      return {
        text:
          tasks.length === 0
            ? "✅ No overdue tasks!"
            : `🔴 <b>Overdue Tasks (${tasks.length})</b>\n\n` +
              tasks
                .map((t) => `• ${t.title} — due ${format(new Date(t.dueDate!), "MMM d")}`)
                .join("\n"),
      };
    }

    case "done": {
      const query = args.trim();
      if (!query) return { text: "Usage: /done [partial task name]" };
      const task = await prisma.task.findFirst({
        where: {
          status: { not: "DONE" },
          title: { contains: query },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!task) return { text: `No pending task matching "${query}"` };
      await prisma.task.update({
        where: { id: task.id },
        data: { status: "DONE", completedAt: new Date() },
      });
      return { text: `✅ Done: <b>${task.title}</b>` };
    }

    case "habits": {
      const today = new Date().toISOString().slice(0, 10);
      const habits = await prisma.habit.findMany({
        include: { logs: { where: { date: today } } },
        orderBy: { createdAt: "asc" },
      });
      const lines = habits.map((h) => {
        const done = h.logs.some((l) => l.completed);
        return `${done ? "✅" : "⬜"} ${h.icon} ${h.name}`;
      });
      return {
        text: `🎯 <b>Habits Today</b>\n\n${lines.join("\n") || "No habits set up yet."}`,
      };
    }

    case "finance": {
      const now = new Date();
      const soon = addDays(now, 7);
      const expenses = await prisma.recurringExpense.findMany({
        where: { status: "ACTIVE", nextDueAt: { lte: soon } },
        orderBy: { nextDueAt: "asc" },
        take: 10,
      });
      if (expenses.length === 0) {
        return { text: "✅ No recurring bills due in the next 7 days." };
      }
      const lines = expenses.map((e) => {
        const diff = Math.ceil((new Date(e.nextDueAt).getTime() - now.getTime()) / 86400000);
        const when = diff <= 0 ? "Due today" : diff === 1 ? "Tomorrow" : `In ${diff}d`;
        return `• ${e.description} — ₹${e.amount.toLocaleString("en-IN")} · ${when}`;
      });
      return { text: `💸 <b>Upcoming Bills</b>\n\n${lines.join("\n")}` };
    }

    case "upcoming": {
      const now = new Date();
      const events = await prisma.calendarEvent.findMany({
        where: { startTime: { gte: now } },
        orderBy: { startTime: "asc" },
        take: 5,
      });
      return {
        text:
          events.length === 0
            ? "📆 No upcoming events."
            : `📆 <b>Upcoming Events</b>\n\n` +
              events
                .map((e) => `• ${e.title} — ${format(new Date(e.startTime), "MMM d, h:mm a")}`)
                .join("\n"),
      };
    }

    case "weather": {
      const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
      if (!settings?.weatherApiKey || !settings.weatherCity) {
        return { text: "⚠️ Weather not configured. Add an API key in Settings." };
      }
      try {
        const unit = settings.temperatureUnit === "F" ? "imperial" : "metric";
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(settings.weatherCity)}&appid=${settings.weatherApiKey}&units=${unit}`
        );
        if (!res.ok) return { text: "⚠️ Could not fetch weather." };
        const data = await res.json() as { main: { temp: number; humidity: number }; weather: { description: string }[] };
        return {
          text: `🌤 <b>${settings.weatherCity}</b>\n${Math.round(data.main.temp)}°${settings.temperatureUnit} · ${data.weather[0].description} · ${data.main.humidity}% humidity`,
        };
      } catch {
        return { text: "⚠️ Weather service error." };
      }
    }

    case "summary": {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const dayEnd = new Date(now);
      dayEnd.setHours(23, 59, 59, 999);

      const [overdue, habits, events, dueExpenses] = await Promise.all([
        prisma.task.findMany({
          where: { status: { not: "DONE" }, dueDate: { lt: now } },
          orderBy: { dueDate: "asc" },
          take: 5,
        }),
        prisma.habit.findMany({
          include: { logs: { where: { date: todayStr } } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.calendarEvent.findMany({
          where: { startTime: { gte: now, lte: dayEnd } },
          orderBy: { startTime: "asc" },
          take: 5,
        }),
        prisma.recurringExpense.findMany({
          where: { status: "ACTIVE", nextDueAt: { lte: dayEnd } },
          orderBy: { nextDueAt: "asc" },
        }),
      ]);

      const lines: string[] = [`📅 <b>Summary — ${format(now, "EEEE, MMM d")}</b>\n`];

      if (overdue.length > 0) {
        lines.push(`🔴 <b>Overdue (${overdue.length})</b>`);
        overdue.forEach((t) => lines.push(`  • ${t.title}`));
        lines.push("");
      }
      if (events.length > 0) {
        lines.push(`📆 <b>Today's Events</b>`);
        events.forEach((e) => lines.push(`  • ${e.title} — ${format(new Date(e.startTime), "h:mm a")}`));
        lines.push("");
      }
      if (habits.length > 0) {
        const doneCount = habits.filter((h) => h.logs.some((l) => l.completed)).length;
        lines.push(`🎯 <b>Habits (${doneCount}/${habits.length})</b>`);
        habits.forEach((h) => lines.push(`  ${h.logs.some((l) => l.completed) ? "✅" : "⬜"} ${h.icon} ${h.name}`));
        lines.push("");
      }
      if (dueExpenses.length > 0) {
        lines.push(`💸 <b>Due Today</b>`);
        dueExpenses.forEach((e) => lines.push(`  • ${e.description} — ₹${e.amount.toLocaleString("en-IN")}`));
      }
      if (lines.length === 1) lines.push("All clear! Nothing pending today. ✨");

      return { text: lines.join("\n") };
    }

    case "addtask": {
      if (!args.trim()) return { text: "Usage: /addtask [title] [--low|--high|--urgent]" };

      // Parse optional priority flag: --low, --high, --urgent
      const priorityMatch = args.match(/--(\w+)$/i);
      const priorityMap: Record<string, string> = {
        low: "LOW", medium: "MEDIUM", high: "HIGH", urgent: "URGENT",
      };
      const flagKey = priorityMatch?.[1]?.toLowerCase() ?? "";
      const priority = priorityMap[flagKey] ?? "MEDIUM";
      const title = args.replace(/--\w+$/, "").trim();

      if (!title) return { text: "Usage: /addtask [title] [--low|--high|--urgent]" };

      const task = await prisma.task.create({
        data: { title, priority, status: "TODO" },
      });
      return { text: `✅ Task created: <b>${task.title}</b> [${task.priority}]` };
    }

    case "addnote": {
      if (!args.trim()) return { text: "Usage: /addnote [title]" };
      const note = await prisma.note.create({
        data: { title: args.trim(), content: "" },
      });
      return { text: `📝 Note created: <b>${note.title}</b>` };
    }

    default:
      return { text: `Unknown command /${command}. Send /help for a list.` };
  }
}

export function parseCommand(text: string): { command: string; args: string } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return null;
  const [rawCmd, ...rest] = trimmed.slice(1).split(/\s+/);
  return { command: rawCmd.toLowerCase().split("@")[0], args: rest.join(" ") };
}
