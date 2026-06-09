"use server";

import { requireAuth } from "@/lib/auth-guard";
import { NotificationManager } from "@/lib/channels/notification-manager";
import { telegramChannel } from "@/lib/channels/telegram-channel";

/** Send a plain text notification via all active channels */
export async function sendTelegramMessage(text: string) {
  await NotificationManager.sendToAll({ title: "", body: text, type: "INFO" });
  return { ok: true };
}

/** Test a specific bot token + chat ID before saving */
export async function testTelegramConnection(token: string, chatId: string) {
  await requireAuth();
  return telegramChannel.testConnection({ botToken: token, chatId });
}

/** Register the Telegram webhook at Telegram's servers */
export async function setTelegramWebhook(token: string, webhookUrl: string) {
  await requireAuth();
  return telegramChannel.setupWebhook(webhookUrl.replace(/\/api\/channels\/telegram\/webhook.*/, ""), {
    botToken: token,
    chatId: "",
  });
}

/** Process an incoming update from Telegram (called by the old /api/telegram/webhook route) */
export async function processWebhookUpdate(update: unknown) {
  await NotificationManager.handleIncoming("telegram", update);
}
