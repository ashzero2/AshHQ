import { getFinanceSummary } from "@/lib/services/finance";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export async function FinanceWidget() {
  const now = new Date();
  const summary = await getFinanceSummary(now.getMonth() + 1, now.getFullYear());

  if (summary.totalIncome === 0 && summary.totalExpenses === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <DollarSign size={24} className="mb-2" />
        <p className="text-sm">No transactions</p>
        <Link href="/finance" className="text-blue-400 text-xs mt-1 hover:underline">
          Add a transaction
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 flex items-center gap-1"><TrendingUp size={12} className="text-green-400" /> Income</span>
          <span className="text-sm font-medium text-green-400">{formatCurrency(summary.totalIncome)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 flex items-center gap-1"><TrendingDown size={12} className="text-red-400" /> Expense</span>
          <span className="text-sm font-medium text-red-400">{formatCurrency(summary.totalExpenses)}</span>
        </div>
        <div className="border-t border-zinc-800 pt-2 flex items-center justify-between">
          <span className="text-xs text-zinc-400">Balance</span>
          <span className={`text-sm font-bold ${summary.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
            {formatCurrency(summary.balance)}
          </span>
        </div>
      </div>
      <Link href="/finance" className="text-xs text-blue-400 hover:text-blue-300 mt-2 pt-2 border-t border-zinc-800">
        View details →
      </Link>
    </div>
  );
}
