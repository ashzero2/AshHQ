import { AppShell } from "@/components/layout/app-shell";
import { getHabits } from "@/lib/services/habits";
import { HabitView } from "@/components/features/habits/habit-view";

export default async function HabitsPage() {
  const habits = await getHabits();
  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Habits</h1>
        <HabitView habits={habits} />
      </div>
    </AppShell>
  );
}
