"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { UpdateSettingsSchema } from "@/lib/validations";
import type { UpdateSettingsInput } from "@/lib/validations";

export async function getSettings() {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });
  if (!settings) throw new Error("Settings not found. Run seed first.");
  return settings;
}

export async function saveDashboardLayout(layout: object) {
  await prisma.settings.update({
    where: { id: "singleton" },
    data: { dashboardLayout: JSON.stringify(layout) },
  });
}

export async function updateSettings(data: UpdateSettingsInput) {
  const parsed = UpdateSettingsSchema.parse(data);
  const settings = await prisma.settings.update({
    where: { id: "singleton" },
    data: parsed,
  });
  revalidatePath("/");
  revalidatePath("/settings");
  return settings;
}
