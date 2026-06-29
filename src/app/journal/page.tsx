export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { getJournalEntries } from "@/lib/services/journal";
import { format } from "date-fns";
import { JournalView } from "@/components/features/journal/journal-view";

export default async function JournalPage() {
  const entries = await getJournalEntries(60);
  const todayDate = format(new Date(), "yyyy-MM-dd");
  return (
    <AppShell>
      <div className="h-full flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6 flex-shrink-0 border-b border-outline/70 pb-5">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Journal</h1>
            <p className="text-sm text-muted-fg mt-1">Daily entries and mood history.</p>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <JournalView entries={entries} todayDate={todayDate} />
        </div>
      </div>
    </AppShell>
  );
}
