import { NextRequest, NextResponse } from "next/server";
import { NotificationManager } from "@/lib/channels/notification-manager";
import { approveExpenseInternal, snoozeExpenseInternal } from "@/lib/services/recurring-expenses-internal";
import { prisma } from "@/lib/db";

async function getWebhookSecret(): Promise<string | null> {
  if (process.env.TELEGRAM_WEBHOOK_SECRET) return process.env.TELEGRAM_WEBHOOK_SECRET;
  const s = await prisma.settings.findUnique({ where: { id: "singleton" } });
  return s?.telegramBotToken ?? null;
}

async function verifyTelegramWebhook(req: NextRequest): Promise<boolean> {
  const secret = await getWebhookSecret();
  if (!secret) return false;
  const header = req.headers.get("x-telegram-bot-api-secret-token");
  return header === secret;
}

async function answerCallbackQuery(botToken: string, callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
  });
}

async function handleCallback(callbackData: string, botToken: string, callbackQueryId: string) {
  const [action, type, id] = callbackData.split(":");
  if (type !== "expense" || !id) return;

  if (action === "approve") {
    const { amount } = await approveExpenseInternal(id);
    await answerCallbackQuery(botToken, callbackQueryId, `✅ Recorded ₹${amount.toLocaleString("en-IN")}`);
  } else if (action === "snooze") {
    await snoozeExpenseInternal(id, 7);
    await answerCallbackQuery(botToken, callbackQueryId, "⏰ Snoozed 7 days");
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;

    if (channelId === "telegram" && !(await verifyTelegramWebhook(req))) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const data = await req.json() as {
      callback_query?: { id?: string; data?: string };
    };

    if (channelId === "telegram" && data.callback_query?.data && data.callback_query?.id) {
      const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
      const botToken = process.env.TELEGRAM_BOT_TOKEN ?? settings?.telegramBotToken ?? "";
      if (botToken) {
        await handleCallback(data.callback_query.data, botToken, data.callback_query.id);
        return NextResponse.json({ ok: true });
      }
    }

    await NotificationManager.handleIncoming(channelId, data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
