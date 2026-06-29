export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { getTransactionPage, getFinanceSummary } from "@/lib/services/finance";
import { getRecurringExpenses } from "@/lib/services/recurring-expenses";
import { FinanceView } from "@/components/features/finance/finance-view";
import { format } from "date-fns";

export default async function FinancePage() {
  const now = new Date();

  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: format(d, "MMM") };
  });

  const [txPage, summary, recurringExpenses, ...monthSummaries] = await Promise.all([
    getTransactionPage(),
    getFinanceSummary(now.getMonth() + 1, now.getFullYear()),
    getRecurringExpenses(),
    ...chartMonths.map(({ month, year, label }) =>
      getFinanceSummary(month, year).then((s) => ({
        name: label,
        income: s.totalIncome,
        expenses: s.totalExpenses,
      }))
    ),
  ]);

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-6 flex-shrink-0 border-b border-outline/70 pb-5">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Finance</h1>
          <p className="text-sm text-muted-fg mt-1">Monthly cash flow, categories, and recurring expenses.</p>
        </div>
        <FinanceView
          transactions={txPage.items}
          initialNextCursor={txPage.nextCursor}
          summary={summary}
          monthlyData={monthSummaries}
          recurringExpenses={recurringExpenses}
        />
      </div>
    </AppShell>
  );
}
