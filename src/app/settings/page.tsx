import { AppShell } from "@/components/layout/app-shell";
import { getSettings } from "@/lib/services/settings";
import { SettingsView } from "@/components/features/settings/settings-view";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <SettingsView settings={settings} />
      </div>
    </AppShell>
  );
}
