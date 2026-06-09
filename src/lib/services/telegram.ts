"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

const TELEGRAM_API = "https://api.telegram.org/bot";

async function getConfig() {
  const s = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!s?.telegramBotToken || !s.telegramChatId || !s.telegramEnabled) return null;
  return { token: s.telegramBotToken, chatId: s.telegramChatId };
}

export async function sendTelegramMessage(text: string) {
  const cfg = await getConfig();
  if (!cfg) return { ok: false, error: "Telegram not configured" };
  const res = await fetch(`${TELEGRAM_API}${cfg.token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: cfg.chatId, text, parse_mode: "HTML" }),
  });
  const data = await res.json();
  return { ok: data.ok, error: data.description };
}

export async function testTelegramConnection(token: string, chatId: string) {
  await requireAuth();
  const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: "✅ AshHQ connected to Telegram!" }),
  });
  const data = await res.json();
  return { ok: data.ok as boolean, error: data.description as string | undefined };
}

export async function setTelegramWebhook(token: string, webhookUrl: string) {
  await requireAuth();
  const res = await fetch(`${TELEGRAM_API}${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  return res.json();
}

export async function processWebhookUpdate(update: {
  message?: { text?: string; chat?: { id: number } };
}) {
  if (!update.message?.text) return;
  const text = update.message.text.toLowerCase().trim();
  const chatId = String(update.message.chat?.id);

  const cfg = await getConfig();
  if (!cfg || chatId !== cfg.chatId) return;

  let reply = "";
  if (text === "/start" || text === "/help") {
    reply =
      "🏠 <b>AshHQ Commands</b>\n\n" +
      "/tasks — view pending tasks\n" +
      "/habits — today's habit status\n" +
      "/finance — this month's summary\n" +
      "/journal — open today's journal\n";
  } else if (text === "/tasks") {
    const tasks = await prisma.task.findMany({
      where: { status: { not: "DONE" } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 10,
    });
    reply =
      tasks.length === 0
        ? "✅ No pending tasks!"
        : `📋 <b>Pending Tasks (${tasks.length})</b>\n\n` +
          tasks.map((t) => `• ${t.title} [${t.priority}]`).join("\n");
  } else if (text === "/habits") {
    const today = new Date().toISOString().slice(0, 10);
    const habits = await prisma.habit.findMany({
      include: { logs: { where: { date: today } } },
    });
    const lines = habits.map((h) => {
      const done = h.logs.some((l) => l.completed);
      return `${done ? "✅" : "⬜"} ${h.icon} ${h.name}`;
    });
    reply = `🎯 <b>Habits Today</b>\n\n${lines.join("\n") || "No habits set up yet."}`;
  } else if (text === "/finance") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const txs = await prisma.transaction.findMany({ where: { date: { gte: start, lte: end } } });
    const income = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    reply =
      `💰 <b>Finance This Month</b>\n\n` +
      `Income: +₹${income.toFixed(2)}\nExpenses: -₹${expenses.toFixed(2)}\nBalance: ₹${(income - expenses).toFixed(2)}`;
  } else {
    reply = "Unknown command. Send /help for a list of commands.";
  }

  await fetch(`${TELEGRAM_API}${cfg.token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: cfg.chatId, text: reply, parse_mode: "HTML" }),
  });
}
