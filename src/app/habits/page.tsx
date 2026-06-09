import { AppShell } from "@/components/layout/app-shell";
import { getHabits } from "@/lib/services/habits";
import { HabitView } from "@/components/features/habits/habit-view";

export default async function HabitsPage() {
  const habits = await getHabits();
  return (
    <AppShell>
      <div className="h-full flex flex-col">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Habits</h1>
          <p className="text-sm text-muted-fg mt-0.5">Build and track your daily routines</p>
        </div>
        <HabitView habits={habits} />
      </div>
    </AppShell>
  );
}
