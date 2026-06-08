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
      const success = await verifyPin(pin);
      if (success) {
        router.push("/");
        router.refresh();
      } else {
        setError("Incorrect PIN");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 mb-4">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white">AshHQ</h1>
          <p className="text-zinc-400 text-sm mt-1">Enter your PIN to unlock</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: Math.max(4, pin.length + 1) }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? "bg-blue-500 scale-110"
                  : "bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center mb-4 animate-pulse">
            {error}
          </p>
        )}

        {/* Keypad */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-16 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-white text-xl font-medium transition-all duration-150 active:scale-95 border border-zinc-700/50"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleDelete}
              className="h-16 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 text-sm font-medium transition-all duration-150 active:scale-95 border border-zinc-700/50"
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              className="h-16 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-white text-xl font-medium transition-all duration-150 active:scale-95 border border-zinc-700/50"
            >
              0
            </button>
            <button
              type="submit"
              disabled={pin.length < 4 || isPending}
              className="h-16 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-medium transition-all duration-150 active:scale-95"
            >
              {isPending ? "..." : "→"}
            </button>
          </div>
        </form>

        <p className="text-zinc-600 text-xs text-center mt-6">
          Default PIN: 1234
        </p>
      </div>
    </div>
  );
}
