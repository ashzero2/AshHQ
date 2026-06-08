"use client";

import { useState, useTransition } from "react";
import { createTransaction, deleteTransaction } from "@/lib/services/finance";
import { formatCurrency } from "@/lib/utils";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Transaction } from "@prisma/client";

interface FinanceViewProps {
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    byCategory: { category: string; amount: number; percentage: number }[];
  };
}

export function FinanceView({ transactions, summary }: FinanceViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
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
        await createTransaction({ amount: parseFloat(amount), type, category, description: description.trim() || null, date: new Date(date) });
        toast.success("Transaction added");
        setAmount(""); setCategory(""); setDescription(""); setShowForm(false);
      } catch { toast.error("Failed to add transaction"); }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => { await deleteTransaction(id); toast.success("Transaction deleted"); });
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 mb-1"><ArrowUpRight size={16} /><span className="text-xs">Income</span></div>
          <p className="text-xl font-bold">{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 mb-1"><ArrowDownRight size={16} /><span className="text-xs">Expenses</span></div>
          <p className="text-xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-1"><Wallet size={16} /><span className="text-xs">Balance</span></div>
          <p className="text-xl font-bold">{formatCurrency(summary.balance)}</p>
        </div>
      </div>

      {/* Category breakdown */}
      {summary.byCategory.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Spending by Category</h3>
          <div className="space-y-2">
            {summary.byCategory.sort((a, b) => b.amount - a.amount).map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-28 truncate">{cat.category}</span>
                <div className="flex-1 bg-zinc-800 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(cat.percentage, 100)}%` }} /></div>
                <span className="text-xs text-zinc-400 w-20 text-right">{formatCurrency(cat.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add button + form */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-zinc-400">{transactions.length} transactions</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"><Plus size={16} /> Add Transaction</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex gap-2">
            {(["EXPENSE", "INCOME"] as const).map((t) => (
              <button key={t} type="button" onClick={() => { setType(t); setCategory(""); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === t ? (t === "INCOME" ? "bg-green-600" : "bg-red-600") : "bg-zinc-800 text-zinc-400"}`}>{t === "INCOME" ? "Income" : "Expense"}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="">Category</option>
              {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">Cancel</button>
            <button type="submit" disabled={!amount || !category || isPending} className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-sm font-medium">{isPending ? "Adding..." : "Add"}</button>
          </div>
        </form>
      )}

      {/* Transaction list */}
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div key={tx.id} className="group flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "INCOME" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {tx.type === "INCOME" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tx.description || tx.category}</p>
              <p className="text-xs text-zinc-500">{tx.category} · {format(new Date(tx.date), "MMM d")}</p>
            </div>
            <span className={`text-sm font-medium ${tx.type === "INCOME" ? "text-green-400" : "text-red-400"}`}>{tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}</span>
            <button onClick={() => handleDelete(tx.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 transition-all"><Trash2 size={14} /></button>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="text-center py-12 text-zinc-500"><Wallet size={32} className="mx-auto mb-2" /><p className="text-sm">No transactions yet</p></div>
        )}
      </div>
    </div>
  );
}
