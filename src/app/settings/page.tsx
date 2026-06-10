export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { getSettings } from "@/lib/services/settings";
import { SettingsView } from "@/components/features/settings/settings-view";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-fg mt-0.5">Configure your command center</p>
        </div>
        <SettingsView settings={settings} />
      </div>
    </AppShell>
  );
}
