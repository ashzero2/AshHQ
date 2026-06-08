"use client";

import { Wallet } from "lucide-react";

export function FinanceWidget() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
      <Wallet size={24} className="mb-2" />
      <p className="text-sm">Finance</p>
      <p className="text-xs mt-1">No transactions yet</p>
    </div>
  );
}
