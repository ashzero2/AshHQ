export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { Bot } = await import("grammy");
  const { prisma } = await import("@/lib/db");
  const {
    runSchedulerInternal: runScheduler,
    processTaskReminders,
    checkBudgetAlerts,
    sendMorningSummary,
  } = await import("@/lib/services/scheduler-internal");
  const { approveExpenseInternal, snoozeExpenseInternal } = await import(
    "@/lib/services/recurring-expenses-internal"
  );
  const { executeCommand, parseCommand } = await import(
    "@/lib/channels/command-router"
  );
  const cron = (await import("node-cron")).default;

  // ── Scheduler cron (every 15 min) ───────────────────────────────
  cron.schedule("*/15 * * * *", async () => {
    try {
      await Promise.all([runScheduler(), processTaskReminders(), checkBudgetAlerts()]);
    } catch (err) {
      console.error("[scheduler] error:", err);
    }
  });

  // ── Morning summary (default 8am, override with MORNING_SUMMARY_HOUR) ──
  const summaryHour = Number(process.env.MORNING_SUMMARY_HOUR ?? 8);
  cron.schedule(`0 ${summaryHour} * * *`, async () => {
    try {
      await sendMorningSummary();
    } catch (err) {
      console.error("[scheduler] morning summary error:", err);
    }
  });

  // ── Telegram bot ─────────────────────────────────────────────────
  async function getBotToken(): Promise<string | null> {
    if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
    const s = await prisma.settings.findUnique({ where: { id: "singleton" } });
    return s?.telegramBotToken ?? null;
  }

  const token = await getBotToken();
  if (!token) {
    console.log("[telegram] no bot token configured, skipping bot start");
    return;
  }

  async function getAllowedChatId(): Promise<string | null> {
    if (process.env.TELEGRAM_CHAT_ID) return process.env.TELEGRAM_CHAT_ID;
    const s = await prisma.settings.findUnique({ where: { id: "singleton" } });
    return s?.telegramChatId ?? null;
  }

  const bot = new Bot(token);

  // Block all updates from chats other than the configured one
  bot.use(async (ctx, next) => {
    const chatId = await getAllowedChatId();
    if (!chatId) return;
    if (String(ctx.chat?.id) !== chatId) return;
    await next();
  });

  // Commands
  bot.command(["start", "help"], async (ctx) => {
    const result = await executeCommand("help", "");
    await ctx.reply(result.text, { parse_mode: "HTML" });
  });

  bot.command("tasks", async (ctx) => {
    const result = await executeCommand("tasks", "");
    await ctx.reply(result.text, { parse_mode: "HTML" });
  });

  bot.command("habits", async (ctx) => {
    const result = await executeCommand("habits", "");
    await ctx.reply(result.text, { parse_mode: "HTML" });
  });

  bot.command("finance", async (ctx) => {
    const result = await executeCommand("finance", "");
    await ctx.reply(result.text, { parse_mode: "HTML" });
  });

  bot.command("overdue", async (ctx) => {
    const result = await executeCommand("overdue", "");
    await ctx.reply(result.text, { parse_mode: "HTML" });
  });

  bot.command("upcoming", async (ctx) => {
    const result = await executeCommand("upcoming", "");
    await ctx.reply(result.text, { parse_mode: "HTML" });
  });

  bot.command("budget", async (ctx) => {
    const result = await executeCommand("budget", "");
    await ctx.reply(result.text, { parse_mode: "HTML" });
  });

  bot.command("weather", async (ctx) => {
    const result = await executeCommand("weather", "");
    await ctx.reply(result.text, { parse_mode: "HTML" });
  });

  bot.command("summary", async (ctx) => {
    const result = await executeCommand("summary", "");
    await ctx.reply(result.text, { parse_mode: "HTML" });
  });

  bot.on("message:text", async (ctx) => {
    const parsed = parseCommand(ctx.message.text);
    if (!parsed) return;
    const result = await executeCommand(parsed.command, parsed.args);
    await ctx.reply(result.text, { parse_mode: "HTML" });
  });

  // Inline button callbacks
  bot.callbackQuery(/^approve:expense:(.+)$/, async (ctx) => {
    try {
      const id = ctx.match[1];
      const { amount } = await approveExpenseInternal(id);
      await ctx.answerCallbackQuery({
        text: `✅ Recorded ₹${amount.toLocaleString("en-IN")}`,
      });
    } catch (err) {
      await ctx.answerCallbackQuery({ text: "❌ Failed to record" });
      console.error("[telegram] approve error:", err);
    }
  });

  bot.callbackQuery(/^snooze:expense:(.+)$/, async (ctx) => {
    try {
      const id = ctx.match[1];
      await snoozeExpenseInternal(id, 7);
      await ctx.answerCallbackQuery({ text: "⏰ Snoozed 7 days" });
    } catch (err) {
      await ctx.answerCallbackQuery({ text: "❌ Failed to snooze" });
      console.error("[telegram] snooze error:", err);
    }
  });

  bot.catch((err) => {
    console.error("[telegram] bot error:", err);
  });

  // Delete any previously registered webhook so long polling gets all updates cleanly.
  // If a webhook URL is actively needed, set TELEGRAM_WEBHOOK_URL and skip polling.
  if (process.env.TELEGRAM_WEBHOOK_URL) {
    console.log("[telegram] TELEGRAM_WEBHOOK_URL set — skipping long polling, webhook mode active");
  } else {
    await bot.api.deleteWebhook().catch(() => {});
    bot.start().catch((err) => console.error("[telegram] start error:", err));
    console.log("[telegram] bot started (long polling)");
  }
}
