"use client";

import { useState, useTransition } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { createLink, deleteLink } from "@/lib/services/links";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Link2, Search, X, FolderOpen } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { QuickLink } from "@prisma/client";

interface LinksViewProps {
  links: QuickLink[];
}

const inputCls =
  "bg-surface-raised border border-outline rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/60 transition-colors";

export function LinksView({ links: initialLinks }: LinksViewProps) {
  const [links, setLinks] = useState<QuickLink[]>(initialLinks);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");

  const categories = Array.from(
    new Set(links.map((l) => l.category).filter(Boolean) as string[])
  ).sort();

  const filtered = links.filter((l) => {
    const matchesSearch =
      !debouncedSearch ||
      l.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      l.url.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      l.category?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory = !activeCategory || l.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAdd = () => {
    const trimUrl = url.trim();
    const trimTitle = title.trim();
    if (!trimUrl || !trimTitle) return;

    startTransition(async () => {
      try {
        const fullUrl = trimUrl.startsWith("http") ? trimUrl : `https://${trimUrl}`;
        let favicon: string | null = null;
        try {
          favicon = `https://www.google.com/s2/favicons?domain=${new URL(fullUrl).hostname}&sz=32`;
        } catch { /* ignore */ }

        const link = await createLink({
          url: fullUrl,
          title: trimTitle,
          icon: favicon,
          category: category.trim() || null,
          sortOrder: links.length,
        });
        setLinks((prev) => [...prev, link]);
        setTitle(""); setUrl(""); setCategory(""); setShowForm(false);
        toast.success("Link added");
      } catch { toast.error("Failed to add link"); }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteLink(id);
        setLinks((prev) => prev.filter((l) => l.id !== id));
        toast.success("Link removed");
      } catch { toast.error("Failed to remove link"); }
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0 border-b border-outline/70 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Links</h1>
          <p className="text-sm text-muted-fg mt-1">{links.length} bookmark{links.length !== 1 ? "s" : ""} saved.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent hover:bg-accent-light text-background text-sm font-semibold transition-colors"
        >
          <Plus size={15} /> Add Link
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-surface border border-outline/80 rounded-lg p-4 mb-5 flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr] gap-3 mb-3">
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className={inputCls + " w-full"}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className={inputCls + " w-full"}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (optional)"
              className={inputCls + " w-full"}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              list="existing-categories"
            />
            <datalist id="existing-categories">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setTitle(""); setUrl(""); setCategory(""); }}
              className="px-3 py-1.5 rounded-lg text-sm text-muted-fg hover:text-foreground bg-surface-raised hover:bg-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!title.trim() || !url.trim() || isPending}
              className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-light text-background text-sm font-semibold disabled:bg-surface-raised disabled:text-subtle-fg transition-colors"
            >
              {isPending ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle-fg pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links…"
            className="w-full bg-surface-raised border border-outline rounded-lg pl-8 pr-8 py-2 text-sm text-foreground placeholder:text-subtle-fg focus:outline-none focus:border-accent/60 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle-fg hover:text-muted-fg">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveCategory(null)}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                !activeCategory
                  ? "bg-accent text-background"
                  : "bg-surface-raised text-muted-fg border border-outline hover:text-foreground"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-accent text-background"
                    : "bg-surface-raised text-muted-fg border border-outline hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Remove link?"
          description={`"${links.find((l) => l.id === confirmDelete)?.title}" will be permanently removed.`}
          onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
          confirmLabel="Remove"
        />
      )}

      {/* Links grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            {links.length === 0 ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-outline flex items-center justify-center">
                  <Link2 size={20} className="text-muted-fg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No links yet</p>
                  <p className="text-[12px] text-muted-fg mt-1">Add your first bookmark above</p>
                </div>
              </>
            ) : (
              <>
                <Search size={20} className="text-subtle-fg" />
                <p className="text-sm text-muted-fg">No links match your search</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Group by category if no active filter and categories exist */}
            {!activeCategory && !search && categories.length > 0 ? (
              <div className="space-y-6">
                {/* Uncategorised */}
                {filtered.filter((l) => !l.category).length > 0 && (
                  <CategoryGroup
                    name="Uncategorised"
                    links={filtered.filter((l) => !l.category)}
                    onDelete={setConfirmDelete}
                  />
                )}
                {categories.map((cat) => {
                  const catLinks = filtered.filter((l) => l.category === cat);
                  if (!catLinks.length) return null;
                  return <CategoryGroup key={cat} name={cat} links={catLinks} onDelete={setConfirmDelete} />;
                })}
              </div>
            ) : (
              <LinkGrid links={filtered} onDelete={setConfirmDelete} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CategoryGroup({ name, links, onDelete }: { name: string; links: QuickLink[]; onDelete: (id: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen size={13} className="text-subtle-fg" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-subtle-fg">{name}</span>
        <span className="text-[10px] text-subtle-fg">({links.length})</span>
      </div>
      <LinkGrid links={links} onDelete={onDelete} />
    </div>
  );
}

function LinkGrid({ links, onDelete }: { links: QuickLink[]; onDelete: (id: string) => void }) {
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
      {links.map((link) => (
        <LinkCard key={link.id} link={link} onDelete={onDelete} />
      ))}
    </div>
  );
}

function LinkCard({ link, onDelete }: { link: QuickLink; onDelete: (id: string) => void }) {
  const hostname = (() => {
    try { return new URL(link.url).hostname.replace("www.", ""); }
    catch { return link.url; }
  })();

  return (
    <div className="group relative flex items-center gap-3 p-3.5 rounded-xl border border-outline bg-surface hover:border-outline-strong hover:bg-surface-raised transition-all">
      {/* Favicon */}
      <div className="w-9 h-9 rounded-lg bg-surface-raised border border-outline flex items-center justify-center flex-shrink-0 overflow-hidden">
        {link.icon ? (
          <img
            src={link.icon}
            alt=""
            className="w-5 h-5 object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <ExternalLink size={14} className="text-muted-fg" />
        )}
      </div>

      {/* Info */}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0"
      >
        <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
          {link.title}
        </p>
        <p className="text-[11px] text-subtle-fg truncate mt-0.5">{hostname}</p>
      </a>

      {/* Category badge */}
      {link.category && (
        <span className="text-[10px] text-muted-fg bg-surface-raised border border-outline px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:block">
          {link.category}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={(e) => { e.preventDefault(); onDelete(link.id); }}
        aria-label="Delete link"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1.5 rounded-lg text-subtle-fg hover:text-rose hover:bg-rose/10 transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
