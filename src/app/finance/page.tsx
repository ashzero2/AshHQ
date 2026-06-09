export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { getTransactionPage, getFinanceSummary } from "@/lib/services/finance";
import { FinanceView } from "@/components/features/finance/finance-view";
import { format } from "date-fns";

export default async function FinancePage() {
  const now = new Date();

  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: format(d, "MMM") };
  });

  const [txPage, summary, ...monthSummaries] = await Promise.all([
    getTransactionPage(),
    getFinanceSummary(now.getMonth() + 1, now.getFullYear()),
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
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Finance</h1>
          <p className="text-sm text-muted-fg mt-0.5">Track your income and expenses</p>
        </div>
        <FinanceView
          transactions={txPage.items}
          initialNextCursor={txPage.nextCursor}
          summary={summary}
          monthlyData={monthSummaries}
        />
      </div>
    </AppShell>
  );
}
