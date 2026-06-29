export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { getNotes } from "@/lib/services/notes";
import { NotesView } from "@/components/features/notes/notes-view";

export default async function NotesPage() {
  const notes = await getNotes();
  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-6 flex-shrink-0 border-b border-outline/70 pb-5">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Notes</h1>
          <p className="text-sm text-muted-fg mt-1">Pinned notes, drafts, and reference material.</p>
        </div>
        <NotesView notes={notes} />
      </div>
    </AppShell>
  );
}
