import { prisma } from "@/lib/db";

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
          "/habits — today's habits\n" +
          "/finance — this month's summary\n" +
          "/addtask [title] — create a task\n" +
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

    case "habits": {
      const today = new Date().toISOString().slice(0, 10);
      const habits = await prisma.habit.findMany({
        include: { logs: { where: { date: today } } },
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
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const txs = await prisma.transaction.findMany({ where: { date: { gte: start, lte: end } } });
      const income = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
      const expenses = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
      return {
        text:
          `💰 <b>Finance This Month</b>\n\n` +
          `Income: +${income.toFixed(2)}\n` +
          `Expenses: -${expenses.toFixed(2)}\n` +
          `Balance: ${(income - expenses).toFixed(2)}`,
      };
    }

    case "addtask": {
      if (!args.trim()) return { text: "Usage: /addtask [title]" };
      const task = await prisma.task.create({
        data: { title: args.trim(), priority: "MEDIUM", status: "TODO" },
      });
      return { text: `✅ Task created: <b>${task.title}</b>` };
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
