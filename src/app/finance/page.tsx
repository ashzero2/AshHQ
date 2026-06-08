import { AppShell } from "@/components/layout/app-shell";
import { getTransactions, getFinanceSummary } from "@/lib/services/finance";
import { FinanceView } from "@/components/features/finance/finance-view";

export default async function FinancePage() {
  const now = new Date();
  const [transactions, summary] = await Promise.all([
    getTransactions(),
    getFinanceSummary(now.getMonth() + 1, now.getFullYear()),
  ]);
  return (
    <AppShell>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Finance</h1>
        <FinanceView transactions={transactions} summary={summary} />
      </div>
    </AppShell>
  );
}
