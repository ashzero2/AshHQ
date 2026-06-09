import { AppShell } from "@/components/layout/app-shell";
import { getJournalEntries, todayDateStr } from "@/lib/services/journal";
import { JournalView } from "@/components/features/journal/journal-view";

export default async function JournalPage() {
  const entries = await getJournalEntries(60);
  const todayDate = todayDateStr();
  return (
    <AppShell>
      <div className="h-full flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Journal</h1>
            <p className="text-sm text-muted-fg mt-0.5">Daily reflections & notes</p>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <JournalView entries={entries} todayDate={todayDate} />
        </div>
      </div>
    </AppShell>
  );
}
