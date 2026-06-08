"use client";

import { Bot } from "lucide-react";

export function AiChatWidget() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
      <Bot size={24} className="mb-2" />
      <p className="text-sm">AI Chat</p>
      <p className="text-xs mt-1">Configure AI provider in settings</p>
    </div>
  );
}
