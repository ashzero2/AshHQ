"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyPin } from "@/lib/services/auth";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await verifyPin(pin);
      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error ?? "Incorrect PIN");
        setPin("");
      }
    });
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 10) {
      setPin((prev) => prev + digit);
      setError("");
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const dots = Math.max(4, pin.length + (pin.length < 10 ? 1 : 0));

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #18161a 0%, #0b0b0f 60%)",
      }}
    >
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-2xl font-bold text-background mb-4 shadow-[0_4px_24px_rgba(232,192,108,0.3)]"
            style={{ background: "linear-gradient(135deg, #e8c06c 0%, #fb923c 100%)" }}
          >
            A
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">AshHQ</h1>
          <p className="text-[13px] text-muted-fg mt-1">Enter your PIN to continue</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-5">
          {Array.from({ length: dots }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? "bg-accent scale-110 shadow-[0_0_8px_rgba(232,192,108,0.6)]"
                  : "bg-surface-raised border border-outline"
              }`}
            />
          ))}
        </div>

        {/* Error */}
        <div className="h-6 flex items-center justify-center mb-1">
          {error && (
            <p className="text-[12px] text-rose font-medium">{error}</p>
          )}
        </div>

        {/* Keypad */}
        <form onSubmit={handleSubmit} className="mt-3">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-14 rounded-xl bg-surface border border-outline text-foreground text-lg font-medium transition-all hover:bg-surface-raised hover:border-outline-strong active:scale-95"
              >
                {digit}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="h-14 rounded-xl bg-surface border border-outline text-muted-fg text-sm transition-all hover:bg-surface-raised hover:text-foreground active:scale-95"
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              className="h-14 rounded-xl bg-surface border border-outline text-foreground text-lg font-medium transition-all hover:bg-surface-raised hover:border-outline-strong active:scale-95"
            >
              0
            </button>
            <button
              type="submit"
              disabled={pin.length < 4 || isPending}
              className="h-14 rounded-xl bg-accent hover:bg-accent-light text-background text-sm font-bold transition-all active:scale-95 disabled:bg-surface disabled:text-subtle-fg disabled:border disabled:border-outline"
            >
              {isPending ? "…" : "→"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
