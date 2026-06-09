import { prisma } from "@/lib/db";
import { getAllChannels, getChannel, registerChannel } from "./channel-registry";
import { telegramChannel } from "./telegram-channel";
import type { ChannelNotificationPayload, ChannelActionablePayload, NotificationChannel } from "./types";

// Register all built-in channels once at module load
registerChannel(telegramChannel);

async function getTelegramConfig(): Promise<Record<string, unknown> | null> {
  const s = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!s?.telegramBotToken || !s.telegramChatId || !s.telegramEnabled) return null;
  return { botToken: s.telegramBotToken, chatId: s.telegramChatId };
}

/** Returns active channels with their resolved configs */
async function getActiveChannels(): Promise<Array<{ channel: NotificationChannel; config: Record<string, unknown> }>> {
  const active: Array<{ channel: NotificationChannel; config: Record<string, unknown> }> = [];

  const tgConfig = await getTelegramConfig();
  if (tgConfig) {
    const ch = getChannel("telegram");
    if (ch) active.push({ channel: ch, config: tgConfig });
  }

  return active;
}

export const NotificationManager = {
  /** Send a notification to ALL enabled channels */
  async sendToAll(payload: ChannelNotificationPayload): Promise<void> {
    const channels = await getActiveChannels();
    await Promise.allSettled(
      channels.map(({ channel, config }) => channel.sendNotification(payload, config))
    );
  },

  /** Send an actionable notification to channels that support actions */
  async sendActionableToAll(payload: ChannelActionablePayload): Promise<void> {
    const channels = await getActiveChannels();
    await Promise.allSettled(
      channels
        .filter(({ channel }) => channel.supportsActions && channel.sendActionable)
        .map(({ channel, config }) => channel.sendActionable!(payload, config))
    );
  },

  /** Route an incoming webhook payload to the correct channel handler */
  async handleIncoming(channelId: string, data: unknown) {
    const ch = getChannel(channelId);
    if (!ch?.handleIncoming) return null;

    const result = await ch.handleIncoming(data);

    if (result.responseText) {
      const config = channelId === "telegram" ? await getTelegramConfig() : null;
      if (config) await ch.sendNotification({ title: "Reply", body: result.responseText, type: "INFO" }, config);
    }

    return result;
  },

  getRegisteredChannels: getAllChannels,
};
