import { getNotes } from "@/lib/services/notes";
import { StickyNote } from "lucide-react";
import Link from "next/link";

export async function NotesWidget() {
  const notes = await getNotes();
  const pinned = notes.filter((n) => n.pinned);
  const recent = pinned.length > 0 ? pinned.slice(0, 3) : notes.slice(0, 3);

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <StickyNote size={24} className="mb-2" />
        <p className="text-sm">No notes yet</p>
        <Link href="/notes" className="text-blue-400 text-xs mt-1 hover:underline">
          Create a note
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 flex-1">
        {recent.map((note) => (
          <div key={note.id} className="p-2 bg-zinc-800/50 rounded-lg">
            <p className="text-sm font-medium truncate">{note.title}</p>
            <p className="text-xs text-zinc-500 line-clamp-1">{note.content || "Empty"}</p>
          </div>
        ))}
      </div>
      <Link href="/notes" className="text-xs text-blue-400 hover:text-blue-300 mt-2 pt-2 border-t border-zinc-800">
        View all notes →
      </Link>
    </div>
  );
}
