"use client";

import { useState, useTransition } from "react";
import {
  deleteRecurringExpense,
  pauseRecurringExpense,
  approveExpense,
  snoozeExpense,
} from "@/lib/services/recurring-expenses";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RecurringExpenseForm } from "./recurring-expense-form";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { Plus, Repeat, Pause, Play, Trash2, Pencil, Check, Clock } from "lucide-react";
import type { RecurringExpense } from "@prisma/client";

function DueBadge({ nextDueAt }: { nextDueAt: Date }) {
  const days = differenceInDays(new Date(nextDueAt), new Date());
  if (days < 0) return <span className="text-[10px] font-semibold text-rose">Overdue</span>;
  if (days === 0) return <span className="text-[10px] font-semibold text-amber-warm">Due today</span>;
  if (days <= 3) return <span className="text-[10px] font-semibold text-amber-warm">In {days}d</span>;
  return <span className="text-[10px] text-muted-fg">{format(new Date(nextDueAt), "MMM d")}</span>;
}

interface Props {
  initialExpenses: RecurringExpense[];
}

export function RecurringExpenseList({ initialExpenses }: Props) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [, start] = useTransition();

  const handleApprove = (id: string) => {
    start(async () => {
      await approveExpense(id);
      const updated = expenses.find((e) => e.id === id);
      setExpenses((prev) => prev.map((e) => {
        if (e.id !== id) return e;
        return { ...e, lastPaidAt: new Date() };
      }));
      toast.success(`Recorded: ${formatCurrency(updated?.amount ?? 0)}`);
    });
  };

  const handleSnooze = (id: string) => {
    start(async () => {
      await snoozeExpense(id, 7);
      setExpenses((prev) => prev.map((e) => {
        if (e.id !== id) return e;
        const next = new Date(e.nextDueAt);
        next.setDate(next.getDate() + 7);
        return { ...e, nextDueAt: next };
      }));
      toast.success("Snoozed 7 days");
    });
  };

  const handlePause = (id: string) => {
    start(async () => {
      const updated = await pauseRecurringExpense(id);
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast.success(updated.status === "PAUSED" ? "Paused" : "Resumed");
    });
  };

  const handleDelete = (id: string) => {
    start(async () => {
      await deleteRecurringExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Recurring expense deleted");
    });
  };

  const totalMonthly = expenses
    .filter((e) => e.status === "ACTIVE")
    .reduce((sum, e) => {
      if (e.frequency === "MONTHLY") return sum + e.amount * e.interval;
      if (e.frequency === "WEEKLY") return sum + (e.amount * 52 * e.interval) / 12;
      if (e.frequency === "YEARLY") return sum + e.amount / 12;
      return sum;
    }, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] text-muted-fg">
            {expenses.length} recurring · ~{formatCurrency(totalMonthly)}/mo
          </p>
        </div>
        <button
          onClick={() => { setEditingExpense(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-background text-[12px] font-semibold hover:bg-accent-light transition-colors"
        >
          <Plus size={13} /> New Recurring
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-16">
          <Repeat size={28} className="mx-auto mb-2 text-subtle-fg" />
          <p className="text-sm text-muted-fg">No recurring expenses yet</p>
          <p className="text-[12px] text-subtle-fg mt-1">Add rent, subscriptions, and bills here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => {
            const isDue = differenceInDays(new Date(exp.nextDueAt), new Date()) <= 0;
            return (
              <div
                key={exp.id}
                className={`group flex items-center gap-3 p-3.5 rounded-xl border bg-surface transition-all ${
                  exp.status === "PAUSED"
                    ? "border-outline opacity-60"
                    : isDue
                    ? "border-rose/40 bg-rose/5"
                    : "border-outline hover:border-outline-strong hover:bg-surface-raised"
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-rose/10 flex items-center justify-center flex-shrink-0">
                  <Repeat size={13} className="text-rose" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{exp.description}</p>
                    <DueBadge nextDueAt={exp.nextDueAt} />
                    {exp.autoApprove && (
                      <span className="text-[9px] font-medium text-emerald bg-emerald/10 px-1.5 py-0.5 rounded">AUTO</span>
                    )}
                    {exp.status === "PAUSED" && (
                      <span className="text-[10px] font-medium text-muted-fg bg-surface-raised px-1.5 py-0.5 rounded">PAUSED</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-fg mt-0.5">
                    {exp.category} · {exp.frequency.charAt(0) + exp.frequency.slice(1).toLowerCase()}
                    {exp.interval > 1 ? ` every ${exp.interval}` : ""}
                  </p>
                </div>

                <span className="text-sm font-semibold text-rose tabular-nums flex-shrink-0">
                  {formatCurrency(exp.amount)}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  {isDue && exp.status === "ACTIVE" && !exp.autoApprove && (
                    <>
                      <button
                        onClick={() => handleApprove(exp.id)}
                        aria-label="Approve expense"
                        className="p-1.5 rounded-lg text-subtle-fg hover:text-emerald hover:bg-emerald/10 transition-colors"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => handleSnooze(exp.id)}
                        aria-label="Snooze 7 days"
                        className="p-1.5 rounded-lg text-subtle-fg hover:text-accent hover:bg-accent/10 transition-colors"
                      >
                        <Clock size={12} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setEditingExpense(exp); setShowForm(true); }}
                    aria-label="Edit recurring expense"
                    className="p-1.5 rounded-lg text-subtle-fg hover:text-foreground hover:bg-surface-raised transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handlePause(exp.id)}
                    aria-label={exp.status === "PAUSED" ? "Resume" : "Pause"}
                    className="p-1.5 rounded-lg text-subtle-fg hover:text-accent hover:bg-accent/10 transition-colors"
                  >
                    {exp.status === "PAUSED" ? <Play size={12} /> : <Pause size={12} />}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(exp.id)}
                    aria-label="Delete recurring expense"
                    className="p-1.5 rounded-lg text-subtle-fg hover:text-rose hover:bg-rose/10 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <RecurringExpenseForm
          expense={editingExpense ?? undefined}
          onClose={() => { setShowForm(false); setEditingExpense(null); }}
          onSave={(saved) => {
            setExpenses((prev) =>
              editingExpense
                ? prev.map((e) => (e.id === saved.id ? saved : e))
                : [saved, ...prev]
            );
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete recurring expense?"
          description="This removes the recurring template. Past transactions are not affected."
          onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
