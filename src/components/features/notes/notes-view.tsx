"use client";

import { useState, useTransition } from "react";
import { createNote, updateNote, deleteNote, togglePinNote } from "@/lib/services/notes";
import { Plus, Trash2, Pin, StickyNote, Save } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Note } from "@prisma/client";

interface NotesViewProps { notes: Note[]; }

export function NotesView({ notes }: NotesViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        await createNote({ title: title.trim(), content, pinned: false });
        toast.success("Note created");
        setTitle(""); setContent(""); setShowForm(false);
      } catch { toast.error("Failed to create note"); }
    });
  };

  const handleSave = () => {
    if (!editingNote) return;
    startTransition(async () => {
      try {
        await updateNote({ id: editingNote.id, title, content });
        toast.success("Note saved");
        setEditingNote(null);
      } catch { toast.error("Failed to save"); }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => { await deleteNote(id); toast.success("Note deleted"); setEditingNote(null); });
  };

  const handlePin = (id: string) => {
    startTransition(async () => { await togglePinNote(id); });
  };

  if (editingNote) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditingNote(null)} className="text-sm text-zinc-400 hover:text-white">← Back</button>
          <button onClick={handleSave} disabled={isPending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium ml-auto"><Save size={14} /> Save</button>
        </div>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent text-xl font-bold focus:outline-none" placeholder="Note title" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm min-h-[300px] focus:outline-none focus:border-zinc-700 resize-none font-mono" placeholder="Write your note in markdown..." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-zinc-400">{notes.length} notes</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"><Plus size={16} /> New Note</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 space-y-3">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" autoFocus />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content (markdown)" rows={4} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">Cancel</button>
            <button type="submit" disabled={!title.trim() || isPending} className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-sm font-medium">{isPending ? "Creating..." : "Create"}</button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-12 text-zinc-500"><StickyNote size={32} className="mx-auto mb-2" /><p className="text-sm">No notes yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notes.map((note) => (
            <div key={note.id} onClick={() => { setEditingNote(note); setTitle(note.title); setContent(note.content); }} className={cn("group cursor-pointer p-4 rounded-xl border bg-zinc-900/50 hover:bg-zinc-800/50 transition-all", note.pinned ? "border-yellow-800/50" : "border-zinc-800")}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-sm truncate flex-1">{note.title}</h3>
                <div className="flex gap-1 ml-2">
                  <button onClick={(e) => { e.stopPropagation(); handlePin(note.id); }} className={cn("p-1 transition-all", note.pinned ? "text-yellow-400" : "opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-yellow-400")}><Pin size={12} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 transition-all"><Trash2 size={12} /></button>
                </div>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{note.content || "Empty note"}</p>
              <p className="text-xs text-zinc-600">{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
