"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChatFab() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
      let content = "";
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: "assistant", content }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Couldn't connect. Check your AI settings." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-accent hover:bg-accent-light text-background shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Open AI assistant"
      >
        <Sparkles size={20} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Modal */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-5rem)] bg-surface border border-outline rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                <Sparkles size={14} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">AshHQ AI</p>
                <p className="text-[10px] text-muted-fg mt-0.5">Aware of your data</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="p-1.5 rounded-lg text-subtle-fg hover:text-muted-fg hover:bg-surface-raised transition-colors"
                  title="Clear chat"
                >
                  <RotateCcw size={13} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-subtle-fg hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Sparkles size={22} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Ask me anything</p>
                  <p className="text-[12px] text-muted-fg mt-1">I know your tasks, events, habits,<br />finances, and notes.</p>
                </div>
                <div className="flex flex-col gap-1.5 w-full max-w-[280px] mt-1">
                  {["What's on my schedule today?", "How are my habits going?", "Summarize my finances this month"].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                      className="text-left text-[11px] text-muted-fg hover:text-foreground bg-surface-raised hover:bg-elevated border border-outline hover:border-outline-strong rounded-lg px-3 py-2 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-accent text-background rounded-br-sm"
                        : "bg-surface-raised text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.role === "assistant" && !msg.content && isLoading ? (
                      <span className="inline-flex gap-1 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-fg animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-fg animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-fg animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-foreground [&_code]:bg-elevated [&_code]:px-1 [&_code]:rounded [&_code]:text-[12px]">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-outline flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your tasks, habits, finance…"
              className="flex-1 bg-surface-raised border border-outline rounded-xl px-3.5 py-2 text-[13px] text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-xl bg-accent hover:bg-accent-light text-background disabled:bg-surface-raised disabled:text-subtle-fg transition-all flex items-center justify-center flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
