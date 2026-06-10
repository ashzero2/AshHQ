"use client";

import { useState, useTransition } from "react";
import { createRecurringExpense, updateRecurringExpense } from "@/lib/services/recurring-expenses";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { RecurringExpense } from "@prisma/client";

const FREQUENCIES = ["MONTHLY", "WEEKLY", "YEARLY"] as const;

interface Props {
  expense?: RecurringExpense;
  onClose: () => void;
  onSave: (expense: RecurringExpense) => void;
}

const inputCls =
  "w-full bg-surface-raised border border-outline rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/60 transition-colors";

export function RecurringExpenseForm({ expense, onClose, onSave }: Props) {
  const [isPending, start] = useTransition();
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [category, setCategory] = useState(expense?.category ?? "");
  const [frequency, setFrequency] = useState<string>(expense?.frequency ?? "MONTHLY");
  const [interval, setInterval] = useState(expense?.interval ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState(expense?.dayOfMonth ?? 1);
  const [autoApprove, setAutoApprove] = useState(expense?.autoApprove ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !category) return;
    start(async () => {
      try {
        const data = {
          description: description.trim(),
          amount: parseFloat(amount),
          category,
          frequency: frequency as "MONTHLY" | "WEEKLY" | "YEARLY" | "CUSTOM",
          interval,
          dayOfMonth: frequency === "MONTHLY" || frequency === "YEARLY" ? dayOfMonth : undefined,
          autoApprove,
        };
        if (expense) {
          const updated = await updateRecurringExpense(expense.id, data);
          onSave(updated);
          toast.success("Recurring expense updated");
        } else {
          const created = await createRecurringExpense(data);
          onSave(created);
          toast.success("Recurring expense created");
        }
        onClose();
      } catch {
        toast.error("Failed to save recurring expense");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-surface border border-outline rounded-2xl p-5 w-full max-w-md shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="re-form-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="re-form-title" className="text-sm font-semibold text-foreground">
            {expense ? "Edit Recurring Expense" : "New Recurring Expense"}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-fg hover:text-foreground p-1 rounded-lg">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (e.g. Rent, Netflix)"
            className={inputCls}
          />

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
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-fg block mb-1">Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls}>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-fg block mb-1">Every N</label>
              <input
                type="number"
                min={1}
                max={365}
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          {(frequency === "MONTHLY" || frequency === "YEARLY") && (
            <div>
              <label className="text-[11px] text-muted-fg block mb-1">Day of month (1–28)</label>
              <input
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="accent-accent w-4 h-4"
            />
            <span className="text-sm text-muted-fg">Auto-approve (record automatically when due)</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-surface-raised hover:bg-elevated text-sm text-muted-fg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!description.trim() || !amount || !category || isPending}
              className="flex-1 py-2 rounded-lg bg-accent hover:bg-accent-light text-background text-sm font-semibold disabled:bg-surface-raised disabled:text-subtle-fg transition-colors"
            >
              {isPending ? "Saving…" : expense ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
