"use client";

import { RecurringExpenseList } from "./recurring-expense-list";
import type { RecurringExpense } from "@prisma/client";

interface FinanceViewProps {
  recurringExpenses: RecurringExpense[];
}

export function FinanceView({ recurringExpenses }: FinanceViewProps) {
  return <RecurringExpenseList initialExpenses={recurringExpenses} />;
}
