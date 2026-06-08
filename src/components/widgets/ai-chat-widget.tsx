"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't process that. Check your AI settings." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
          <Sparkles size={20} className="mb-2 text-blue-400" />
          <p className="text-xs">Ask me anything</p>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
          />
          <button type="submit" disabled={!input.trim()} className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors">
            <Send size={12} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 text-xs ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && <Bot size={14} className="text-blue-400 mt-0.5 shrink-0" />}
            <p className={`rounded-lg px-2 py-1 max-w-[85%] ${msg.role === "user" ? "bg-blue-600/20 text-blue-200" : "bg-zinc-800 text-zinc-300"}`}>
              {msg.content || (isLoading ? "..." : "")}
            </p>
            {msg.role === "user" && <User size={14} className="text-zinc-400 mt-0.5 shrink-0" />}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
        />
        <button type="submit" disabled={!input.trim() || isLoading} className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors">
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}
