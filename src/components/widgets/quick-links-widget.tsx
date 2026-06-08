import { getLinks } from "@/lib/services/links";
import { ExternalLink, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export async function QuickLinksWidget() {
  const links = await getLinks();

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <LinkIcon size={24} className="mb-2" />
        <p className="text-sm">No quick links</p>
        <p className="text-xs mt-1">Add links in settings</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
        >
          {link.icon ? (
            <img src={link.icon} alt="" className="w-4 h-4 rounded" />
          ) : (
            <ExternalLink size={12} className="text-zinc-400" />
          )}
          <span className="truncate">{link.title}</span>
        </a>
      ))}
    </div>
  );
}
