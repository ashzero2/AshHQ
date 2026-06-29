export const dynamic = "force-dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { getHabits } from "@/lib/services/habits";
import { HabitView } from "@/components/features/habits/habit-view";

export default async function HabitsPage() {
  const habits = await getHabits();
  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-6 flex-shrink-0 border-b border-outline/70 pb-5">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Habits</h1>
          <p className="text-sm text-muted-fg mt-1">Today&apos;s routine status and streak history.</p>
        </div>
        <HabitView habits={habits} />
      </div>
    </AppShell>
  );
}
