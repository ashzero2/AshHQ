import { getFinanceSummary } from "@/lib/services/finance";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export async function FinanceWidget() {
  const now = new Date();
  const summary = await getFinanceSummary(now.getMonth() + 1, now.getFullYear());

  if (summary.totalIncome === 0 && summary.totalExpenses === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-subtle-fg">
        <div className="w-10 h-10 rounded-xl bg-surface-raised border border-outline flex items-center justify-center">
          <Wallet size={17} className="text-muted-fg" />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-fg">No transactions</p>
          <Link href="/finance" className="text-[11px] text-accent hover:text-accent-light transition-colors mt-0.5 block">
            Add a transaction
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between py-0.5">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-fg">
            <TrendingUp size={12} className="text-emerald" />
            Income
          </span>
          <span className="text-[13px] font-semibold text-emerald tabular-nums">
            {formatCurrency(summary.totalIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-fg">
            <TrendingDown size={12} className="text-rose" />
            Expenses
          </span>
          <span className="text-[13px] font-semibold text-rose tabular-nums">
            {formatCurrency(summary.totalExpenses)}
          </span>
        </div>
        <div className="border-t border-outline/60 pt-2 flex items-center justify-between">
          <span className="text-[12px] text-muted-fg flex items-center gap-1.5">
            <Wallet size={12} className="text-accent" />
            Balance
          </span>
          <span
            className={`text-[14px] font-bold tabular-nums ${summary.balance >= 0 ? "text-emerald" : "text-rose"}`}
          >
            {formatCurrency(summary.balance)}
          </span>
        </div>
      </div>
      <Link
        href="/finance"
        className="text-[11px] text-accent hover:text-accent-light transition-colors mt-2 pt-2 border-t border-outline/60"
      >
        View details →
      </Link>
    </div>
  );
}
