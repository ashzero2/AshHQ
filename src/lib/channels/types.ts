export interface NotificationChannel {
  readonly id: string;
  readonly displayName: string;
  readonly supportsActions: boolean;

  sendNotification(payload: ChannelNotificationPayload, config: Record<string, unknown>): Promise<string | null>;
  sendActionable?(payload: ChannelActionablePayload, config: Record<string, unknown>): Promise<string | null>;
  handleIncoming?(data: unknown): Promise<ChannelIncomingResult>;
  testConnection(config: Record<string, unknown>): Promise<{ success: boolean; error?: string; info?: string }>;
  getConfigSchema(): ChannelConfigField[];
  setupWebhook?(baseUrl: string, config: Record<string, unknown>): Promise<boolean>;
}

export interface ChannelNotificationPayload {
  title: string;
  body: string;
  type: "TASK_REMINDER" | "EXPENSE_DUE" | "HABIT_CHECKIN" | "CALENDAR_EVENT" | "INFO";
  url?: string;
}

export interface ChannelActionablePayload extends ChannelNotificationPayload {
  actions: Array<{
    label: string;
    callbackData: string;
  }>;
}

export interface ChannelIncomingResult {
  handled: boolean;
  action?: {
    type: "COMMAND" | "CALLBACK";
    command?: string;
    args?: string;
    callbackData?: string;
  };
  responseText?: string;
}

export interface ChannelConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "number" | "boolean";
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface TelegramChannelConfig {
  botToken: string;
  chatId: string;
}

export interface TelegramInlineKeyboard {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
}
