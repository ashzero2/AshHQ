import { AppShell } from "@/components/layout/app-shell";
import { getNotes } from "@/lib/services/notes";
import { NotesView } from "@/components/features/notes/notes-view";

export default async function NotesPage() {
  const notes = await getNotes();
  return (
    <AppShell>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Notes</h1>
        <NotesView notes={notes} />
      </div>
    </AppShell>
  );
}
