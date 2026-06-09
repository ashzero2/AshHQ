import { getLinks } from "@/lib/services/links";
import { ExternalLink, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export async function QuickLinksWidget() {
  const links = await getLinks();

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-subtle-fg">
        <LinkIcon size={17} className="text-muted-fg" />
        <div className="text-center">
          <p className="text-xs text-muted-fg">No quick links</p>
          <Link href="/links" className="text-[11px] text-accent hover:text-accent-light transition-colors mt-0.5 inline-block">
            Add bookmarks →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 content-start">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised border border-outline/60 hover:border-outline-strong hover:bg-elevated text-[12px] text-muted-fg hover:text-foreground transition-all"
        >
          {link.icon ? (
            <img src={link.icon} alt="" className="w-3.5 h-3.5 rounded" />
          ) : (
            <ExternalLink size={11} className="text-subtle-fg" />
          )}
          <span className="truncate">{link.title}</span>
        </a>
      ))}
    </div>
  );
}
