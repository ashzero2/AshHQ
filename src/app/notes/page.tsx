import { AppShell } from "@/components/layout/app-shell";
import { getNotes } from "@/lib/services/notes";
import { NotesView } from "@/components/features/notes/notes-view";

export default async function NotesPage() {
  const notes = await getNotes();
  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Notes</h1>
          <p className="text-sm text-muted-fg mt-0.5">Capture your thoughts and ideas</p>
        </div>
        <NotesView notes={notes} />
      </div>
    </AppShell>
  );
}
