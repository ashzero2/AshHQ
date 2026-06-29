export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { getSettings } from "@/lib/services/settings";
import { SettingsView } from "@/components/features/settings/settings-view";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-6 flex-shrink-0 border-b border-outline/70 pb-5">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-fg mt-1">Appearance, integrations, security, and backups.</p>
        </div>
        <SettingsView settings={settings} />
      </div>
    </AppShell>
  );
}
