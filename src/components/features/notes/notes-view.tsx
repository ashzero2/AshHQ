"use client";

import { useState, useTransition } from "react";
import { createNote, updateNote, deleteNote, togglePinNote } from "@/lib/services/notes";
import { Plus, Trash2, Pin, StickyNote, Save, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RichEditor } from "@/components/shared/rich-editor";
import type { Note } from "@prisma/client";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

interface NotesViewProps { notes: Note[]; }

const inputCls =
  "bg-surface-raised border border-outline rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/60 transition-colors";

export function NotesView({ notes }: NotesViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        await createNote({ title: title.trim(), content, contentType: "richtext", pinned: false });
        toast.success("Note created");
        setTitle(""); setContent(""); setShowForm(false);
      } catch { toast.error("Failed to create note"); }
    });
  };

  const handleSave = () => {
    if (!editingNote) return;
    startTransition(async () => {
      try {
        await updateNote({ id: editingNote.id, title, content, contentType: "richtext" });
        toast.success("Note saved");
        setEditingNote(null);
      } catch { toast.error("Failed to save"); }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteNote(id);
      toast.success("Note deleted");
      setEditingNote(null);
      setConfirmDelete(null);
    });
  };

  const handlePin = (id: string) => {
    startTransition(async () => { await togglePinNote(id); });
  };

  /* ── Note editor ── */
  if (editingNote) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingNote(null)}
            className="flex items-center gap-1.5 text-[12px] text-muted-fg hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to notes
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setConfirmDelete(editingNote.id)}
            aria-label="Delete note"
            className="flex items-center gap-1 text-[12px] text-subtle-fg hover:text-rose transition-colors p-1.5 rounded-lg hover:bg-rose/10"
            disabled={isPending}
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-background text-[12px] font-semibold hover:bg-accent-light transition-colors"
          >
            <Save size={12} />
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none placeholder:text-subtle-fg"
          placeholder="Note title"
        />
        <RichEditor
          key={editingNote.id}
          content={editingNote.content}
          onChange={setContent}
          placeholder="Write your note…"
          autofocus
          minHeight="320px"
        />

        {confirmDelete && (
          <ConfirmDialog
            title="Delete note?"
            description={`"${editingNote.title}" will be permanently removed.`}
            onConfirm={() => handleDelete(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </div>
    );
  }

  /* ── Notes list ── */
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-fg">{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-background text-[12px] font-semibold hover:bg-accent-light transition-colors"
        >
          <Plus size={13} /> New Note
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-surface border border-outline rounded-xl p-4 mb-4 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className={cn(inputCls, "w-full")}
            autoFocus
          />
          <RichEditor
            content={content}
            onChange={setContent}
            placeholder="Content…"
            minHeight="72px"
            toolbar={false}
            className="border-outline/60"
          />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-3 py-2 rounded-lg bg-surface-raised hover:bg-elevated text-sm text-muted-fg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isPending}
              className="flex-1 px-3 py-2 rounded-lg bg-accent hover:bg-accent-light text-background text-sm font-semibold disabled:bg-surface-raised disabled:text-subtle-fg transition-colors"
            >
              {isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-14">
          <StickyNote size={28} className="mx-auto mb-3 text-subtle-fg" />
          <p className="text-sm text-muted-fg">No notes yet</p>
          <p className="text-[12px] text-subtle-fg mt-1">Create your first note above</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {notes.map((note) => (
            <div
              key={note.id}
              role="button"
              tabIndex={0}
              onClick={() => { setEditingNote(note); setTitle(note.title); setContent(note.content); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEditingNote(note); setTitle(note.title); setContent(note.content);
                }
              }}
              className={cn(
                "group cursor-pointer p-4 rounded-xl border bg-surface hover:bg-surface-raised transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                note.pinned ? "border-accent/30" : "border-outline hover:border-outline-strong"
              )}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="font-semibold text-sm text-foreground truncate flex-1">{note.title}</h3>
                <div className="flex gap-0.5 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePin(note.id); }}
                    aria-label={note.pinned ? "Unpin note" : "Pin note"}
                    className={cn(
                      "p-1 rounded transition-all",
                      note.pinned
                        ? "text-accent"
                        : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-subtle-fg hover:text-accent"
                    )}
                  >
                    <Pin size={11} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(note.id); }}
                    aria-label="Delete note"
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-subtle-fg hover:text-rose p-1 rounded transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
              <p className="text-[12px] text-muted-fg line-clamp-2 leading-relaxed mb-3">
                {stripHtml(note.content) || "Empty note"}
              </p>
              <p className="text-[11px] text-subtle-fg">
                {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && !editingNote && (
        <ConfirmDialog
          title="Delete note?"
          description={`"${notes.find((n) => n.id === confirmDelete)?.title}" will be permanently removed.`}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
