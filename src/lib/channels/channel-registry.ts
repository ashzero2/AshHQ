import type { NotificationChannel } from "./types";

const registry = new Map<string, NotificationChannel>();

export function registerChannel(channel: NotificationChannel): void {
  registry.set(channel.id, channel);
}

export function getChannel(id: string): NotificationChannel | undefined {
  return registry.get(id);
}

export function getAllChannels(): NotificationChannel[] {
  return Array.from(registry.values());
}
