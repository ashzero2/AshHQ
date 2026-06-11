import type {
  NotificationChannel,
  ChannelNotificationPayload,
  ChannelActionablePayload,
  ChannelIncomingResult,
  ChannelConfigField,
  TelegramChannelConfig,
  TelegramInlineKeyboard,
} from "./types";
import { parseCommand, executeCommand } from "./command-router";

const API = "https://api.telegram.org/bot";

function api(token: string, method: string, body: object) {
  return fetch(`${API}${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

export class TelegramChannel implements NotificationChannel {
  readonly id = "telegram";
  readonly displayName = "Telegram";
  readonly supportsActions = true;

  private cfg(config: Record<string, unknown>): TelegramChannelConfig {
    return {
      botToken: config.botToken as string,
      chatId: config.chatId as string,
    };
  }

  async sendNotification(payload: ChannelNotificationPayload, config: Record<string, unknown>): Promise<string | null> {
    const { botToken, chatId } = this.cfg(config);
    const text = payload.title && payload.title !== "Reply"
      ? `<b>${payload.title}</b>\n${payload.body}`
      : payload.body;
    const res = await api(botToken, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
    return res.ok ? String(res.result?.message_id ?? "") : null;
  }

  async sendActionable(payload: ChannelActionablePayload, config: Record<string, unknown>): Promise<string | null> {
    const { botToken, chatId } = this.cfg(config);
    const keyboard: TelegramInlineKeyboard = {
      inline_keyboard: [payload.actions.map((a) => ({ text: a.label, callback_data: a.callbackData }))],
    };
    const text = `<b>${payload.title}</b>\n${payload.body}`;
    const res = await api(botToken, "sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
    return res.ok ? String(res.result?.message_id ?? "") : null;
  }

  async handleIncoming(data: unknown): Promise<ChannelIncomingResult> {
    const update = data as {
      message?: { text?: string; chat?: { id: number } };
      callback_query?: { data?: string; id?: string };
    };

    if (update.callback_query?.data) {
      return {
        handled: true,
        action: { type: "CALLBACK", callbackData: update.callback_query.data },
      };
    }

    const text = update.message?.text;
    if (!text) return { handled: false };

    const parsed = parseCommand(text);
    if (!parsed) return { handled: false };

    const result = await executeCommand(parsed.command, parsed.args);
    return {
      handled: true,
      action: { type: "COMMAND", command: parsed.command, args: parsed.args },
      responseText: result.text,
    };
  }

  async testConnection(config: Record<string, unknown>): Promise<{ success: boolean; error?: string; info?: string }> {
    const { botToken, chatId } = this.cfg(config);
    const res = await api(botToken, "sendMessage", {
      chat_id: chatId,
      text: "✅ AshHQ connected to Telegram!",
    });
    return res.ok ? { success: true, info: "Message sent!" } : { success: false, error: res.description };
  }

  getConfigSchema(): ChannelConfigField[] {
    return [
      {
        key: "botToken",
        label: "Bot Token",
        type: "password",
        required: true,
        placeholder: "123456:ABC-DEF...",
        helpText: "Get from @BotFather on Telegram",
      },
      {
        key: "chatId",
        label: "Chat ID",
        type: "text",
        required: true,
        placeholder: "Your Telegram user/chat ID",
        helpText: "Message @userinfobot to get your ID",
      },
    ];
  }

  async setupWebhook(baseUrl: string, config: Record<string, unknown>): Promise<boolean> {
    const { botToken } = this.cfg(config);
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? botToken;
    const res = await api(botToken, "setWebhook", {
      url: `${baseUrl}/api/channels/telegram/webhook`,
      secret_token: secret,
    });
    return res.ok === true;
  }
}

export const telegramChannel = new TelegramChannel();
