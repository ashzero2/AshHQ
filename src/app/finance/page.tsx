export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { getRecurringExpenses } from "@/lib/services/recurring-expenses";
import { FinanceView } from "@/components/features/finance/finance-view";

export default async function FinancePage() {
  const recurringExpenses = await getRecurringExpenses();

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-6 flex-shrink-0 border-b border-outline/70 pb-5">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Bills</h1>
          <p className="text-sm text-muted-fg mt-1">Recurring expenses — track, approve, and snooze your bills.</p>
        </div>
        <FinanceView recurringExpenses={recurringExpenses} />
      </div>
    </AppShell>
  );
}
