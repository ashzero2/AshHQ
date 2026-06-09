"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";

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
        assistantContent += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Couldn't connect. Check your AI settings." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Sparkles size={18} className="text-accent" />
          <p className="text-[12px] text-muted-fg">Ask me anything</p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-0 pr-0.5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 text-[12px] ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`rounded-lg px-2.5 py-1.5 max-w-[88%] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent/15 text-accent-light"
                    : "bg-surface-raised text-muted-fg"
                }`}
              >
                {msg.content || (isLoading && msg.role === "assistant" ? (
                  <span className="inline-flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-muted-fg animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 rounded-full bg-muted-fg animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 rounded-full bg-muted-fg animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                ) : "")}
              </p>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-surface-raised border border-outline rounded-lg px-3 py-1.5 text-[12px] text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-1.5 rounded-lg bg-accent text-background disabled:bg-surface-raised disabled:text-subtle-fg transition-all hover:bg-accent-light"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
