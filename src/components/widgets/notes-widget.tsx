import { getNotes } from "@/lib/services/notes";
import { StickyNote, Pin } from "lucide-react";
import Link from "next/link";

export async function NotesWidget() {
  const notes = await getNotes();
  const pinned = notes.filter((n) => n.pinned);
  const recent = pinned.length > 0 ? pinned.slice(0, 3) : notes.slice(0, 3);

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-subtle-fg">
        <div className="w-10 h-10 rounded-xl bg-surface-raised border border-outline flex items-center justify-center">
          <StickyNote size={17} className="text-muted-fg" />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-fg">No notes yet</p>
          <Link href="/notes" className="text-[11px] text-accent hover:text-accent-light transition-colors mt-0.5 block">
            Create a note
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 flex-1 min-h-0 overflow-hidden">
        {recent.map((note) => (
          <div key={note.id} className="p-2.5 bg-surface-raised rounded-lg border border-outline/50">
            <div className="flex items-center gap-1.5 mb-0.5">
              {note.pinned && <Pin size={9} className="text-accent flex-shrink-0" />}
              <p className="text-[13px] font-medium text-foreground truncate">{note.title}</p>
            </div>
            <p className="text-[11px] text-muted-fg line-clamp-1">{note.content || "Empty"}</p>
          </div>
        ))}
      </div>
      <Link
        href="/notes"
        className="text-[11px] text-accent hover:text-accent-light transition-colors mt-2 pt-2 border-t border-outline/60"
      >
        View all notes →
      </Link>
    </div>
  );
}
