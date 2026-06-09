"use client";

import { useState, useTransition } from "react";
import { createTransaction, deleteTransaction, getTransactionPage } from "@/lib/services/finance";
import { formatCurrency, cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Transaction } from "@prisma/client";

interface MonthData { name: string; income: number; expenses: number }

interface FinanceViewProps {
  transactions: Transaction[];
  initialNextCursor: string | null;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    byCategory: { category: string; amount: number; percentage: number }[];
  };
  monthlyData: MonthData[];
}

function MonthlyBarChart({ data }: { data: MonthData[] }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expenses]), 1);

  return (
    <div className="flex items-end gap-2 h-[140px]">
      {data.map((month) => {
        const incomeH = Math.round((month.income / max) * 100);
        const expenseH = Math.round((month.expenses / max) * 100);
        return (
          <div key={month.name} className="flex-1 flex flex-col items-center gap-1.5 h-full group">
            <div className="flex-1 flex items-end gap-[3px] w-full relative">
              {/* subtle hover tooltip */}
              {(month.income > 0 || month.expenses > 0) && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col gap-0.5 bg-elevated border border-outline-strong rounded-lg px-2.5 py-1.5 text-[10px] whitespace-nowrap z-10 shadow-lg">
                  {month.income > 0 && (
                    <span className="text-emerald">+{formatCurrency(month.income)}</span>
                  )}
                  {month.expenses > 0 && (
                    <span className="text-rose">−{formatCurrency(month.expenses)}</span>
                  )}
                </div>
              )}
              <div
                className="flex-1 bg-emerald/75 rounded-t-[3px] transition-all duration-300 min-h-[2px]"
                style={{ height: incomeH > 0 ? `${incomeH}%` : "2px", opacity: incomeH > 0 ? 1 : 0.2 }}
              />
              <div
                className="flex-1 bg-rose/75 rounded-t-[3px] transition-all duration-300 min-h-[2px]"
                style={{ height: expenseH > 0 ? `${expenseH}%` : "2px", opacity: expenseH > 0 ? 1 : 0.2 }}
              />
            </div>
            <span className="text-[10px] text-subtle-fg font-medium">{month.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export function FinanceView({ transactions: initialTransactions, initialNextCursor, summary, monthlyData }: FinanceViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingMore, startLoadMore] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);

  const handleLoadMore = () => {
    if (!nextCursor) return;
    startLoadMore(async () => {
      const page = await getTransactionPage(nextCursor);
      setTransactions((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    });
  };
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;
    startTransition(async () => {
      try {
        const tx = await createTransaction({
          amount: parseFloat(amount),
          type,
          category,
          description: description.trim() || null,
          date: new Date(date),
        });
        setTransactions((prev) => [tx, ...prev]);
        toast.success("Transaction added");
        setAmount(""); setCategory(""); setDescription(""); setShowForm(false);
      } catch { toast.error("Failed to add transaction"); }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success("Transaction deleted");
    });
  };

  const inputCls =
    "bg-surface-raised border border-outline rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/60 transition-colors";

  return (
    <div className="space-y-5">
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-surface border border-outline rounded-xl p-3 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-1 sm:gap-1.5 text-emerald mb-1.5 sm:mb-2">
            <TrendingUp size={12} />
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-muted-fg">Income</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-foreground tabular-nums leading-tight">{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="bg-surface border border-outline rounded-xl p-3 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-1 sm:gap-1.5 text-rose mb-1.5 sm:mb-2">
            <TrendingDown size={12} />
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-muted-fg">Expenses</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-foreground tabular-nums leading-tight">{formatCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="bg-surface border border-outline rounded-xl p-3 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-1 sm:gap-1.5 text-accent mb-1.5 sm:mb-2">
            <Wallet size={12} />
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-muted-fg">Balance</span>
          </div>
          <p className={`text-base sm:text-xl font-bold tabular-nums leading-tight ${summary.balance >= 0 ? "text-emerald" : "text-rose"}`}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      {/* ── Monthly chart ── */}
      <div className="bg-surface border border-outline rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">Monthly Overview</h3>
          <div className="flex items-center gap-3 text-[11px] text-muted-fg">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald inline-block" /> Income</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose inline-block" /> Expenses</span>
          </div>
        </div>
        <MonthlyBarChart data={monthlyData} />
      </div>

      {/* ── Category breakdown ── */}
      {summary.byCategory.length > 0 && (
        <div className="bg-surface border border-outline rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-fg mb-4">
            Spending by Category
          </h3>
          <div className="space-y-3">
            {summary.byCategory.sort((a, b) => b.amount - a.amount).map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-[12px] text-muted-fg w-28 truncate">{cat.category}</span>
                <div className="flex-1 bg-surface-raised rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-rose h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(isFinite(cat.percentage) ? cat.percentage : 0, 100)}%` }}
                  />
                </div>
                <span className="text-[12px] text-muted-fg w-20 text-right tabular-nums">
                  {formatCurrency(cat.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Transactions ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Transactions</h2>
            <p className="text-[12px] text-muted-fg mt-0.5">{transactions.length} total</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-background text-[12px] font-semibold hover:bg-accent-light transition-colors"
          >
            <Plus size={13} /> Add Transaction
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-surface border border-outline rounded-xl p-4 mb-4 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
          >
            <div className="flex gap-2">
              {(["EXPENSE", "INCOME"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setCategory(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    type === t
                      ? t === "INCOME" ? "bg-emerald/20 text-emerald border border-emerald/30" : "bg-rose/20 text-rose border border-rose/30"
                      : "bg-surface-raised text-muted-fg border border-outline hover:text-foreground"
                  }`}
                >
                  {t === "INCOME" ? "Income" : "Expense"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className={inputCls}
              />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                <option value="">Category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className={cn(inputCls, "w-full")}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn(inputCls, "w-full")}
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-3 py-2 rounded-lg bg-surface-raised hover:bg-elevated text-sm text-muted-fg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!amount || !category || isPending}
                className="flex-1 px-3 py-2 rounded-lg bg-accent hover:bg-accent-light text-background text-sm font-semibold disabled:bg-surface-raised disabled:text-subtle-fg transition-colors"
              >
                {isPending ? "Adding…" : "Add"}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="group flex items-center gap-3 p-3.5 rounded-xl border border-outline bg-surface hover:border-outline-strong hover:bg-surface-raised transition-all"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  tx.type === "INCOME" ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose"
                }`}
              >
                {tx.type === "INCOME" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {tx.description || tx.category}
                </p>
                <p className="text-[11px] text-muted-fg mt-0.5">
                  {tx.category} · {format(new Date(tx.date), "MMM d")}
                </p>
              </div>
              <span
                className={`text-sm font-semibold tabular-nums ${tx.type === "INCOME" ? "text-emerald" : "text-rose"}`}
              >
                {tx.type === "INCOME" ? "+" : "−"}{formatCurrency(tx.amount)}
              </span>
              <button
                onClick={() => setConfirmDelete(tx.id)}
                aria-label="Delete transaction"
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-subtle-fg hover:text-rose p-1.5 rounded-lg hover:bg-rose/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-12">
              <Wallet size={28} className="mx-auto mb-2 text-subtle-fg" />
              <p className="text-sm text-muted-fg">No transactions yet</p>
            </div>
          )}

          {nextCursor && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full mt-2 py-2.5 rounded-xl border border-outline text-sm text-muted-fg hover:text-foreground hover:border-outline-strong transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more transactions"}
            </button>
          )}

          {confirmDelete && (
            <ConfirmDialog
              title="Delete transaction?"
              description={`"${transactions.find((t) => t.id === confirmDelete)?.description || transactions.find((t) => t.id === confirmDelete)?.category}" will be permanently removed.`}
              onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
              onCancel={() => setConfirmDelete(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

