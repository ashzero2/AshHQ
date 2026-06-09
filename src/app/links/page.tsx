import { AppShell } from "@/components/layout/app-shell";
import { getLinks } from "@/lib/services/links";
import { LinksView } from "@/components/features/links/links-view";

export default async function LinksPage() {
  const links = await getLinks();
  return (
    <AppShell>
      <LinksView links={links} />
    </AppShell>
  );
}
