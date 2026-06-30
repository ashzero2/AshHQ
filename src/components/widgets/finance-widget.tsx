import { prisma } from "@/lib/db";
import { addDays } from "date-fns";
import { Receipt } from "lucide-react";
import Link from "next/link";

export async function FinanceWidget() {
  const now = new Date();
  const soon = addDays(now, 7);

  const bills = await prisma.recurringExpense.findMany({
    where: { status: "ACTIVE", nextDueAt: { lte: soon } },
    orderBy: { nextDueAt: "asc" },
    take: 4,
  });

  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-subtle-fg">
        <div className="w-10 h-10 rounded-xl bg-surface-raised border border-outline flex items-center justify-center">
          <Receipt size={17} className="text-muted-fg" />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-fg">No bills due this week</p>
          <Link href="/finance" className="text-[11px] text-accent hover:text-accent-light transition-colors mt-0.5 block">
            Manage bills →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 flex-1">
        {bills.map((bill) => {
          const diff = Math.ceil((new Date(bill.nextDueAt).getTime() - now.getTime()) / 86400000);
          const when = diff <= 0 ? "Today" : diff === 1 ? "Tomorrow" : `In ${diff}d`;
          const urgent = diff <= 1;
          return (
            <div key={bill.id} className="flex items-center justify-between gap-2 py-0.5">
              <span className="text-[12px] text-foreground truncate flex-1">{bill.description}</span>
              <span className={`text-[11px] font-medium tabular-nums flex-shrink-0 ${urgent ? "text-rose" : "text-muted-fg"}`}>
                {when}
              </span>
              <span className="text-[12px] font-semibold text-foreground tabular-nums flex-shrink-0">
                ₹{bill.amount.toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>
      <Link
        href="/finance"
        className="text-[11px] text-accent hover:text-accent-light transition-colors mt-2 pt-2 border-t border-outline/60"
      >
        View all bills →
      </Link>
    </div>
  );
}
