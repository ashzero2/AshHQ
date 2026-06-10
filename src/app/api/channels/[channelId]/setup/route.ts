import { NextRequest, NextResponse } from "next/server";
import { getChannel } from "@/lib/channels/channel-registry";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const ch = getChannel(channelId);
    if (!ch?.setupWebhook) {
      return NextResponse.json({ ok: false, error: "Channel not found or doesn't support webhooks" }, { status: 404 });
    }

    // Env vars take precedence over DB
    const botToken = process.env.TELEGRAM_BOT_TOKEN ||
      (await prisma.settings.findUnique({ where: { id: "singleton" } }))?.telegramBotToken;
    const chatId = process.env.TELEGRAM_CHAT_ID ||
      (await prisma.settings.findUnique({ where: { id: "singleton" } }))?.telegramChatId;

    if (!botToken || !chatId) {
      return NextResponse.json({ ok: false, error: "Channel not configured" }, { status: 400 });
    }

    const baseUrl = req.headers.get("origin") ?? req.nextUrl.origin;
    const config = { botToken, chatId };
    const ok = await ch.setupWebhook(baseUrl, config);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
