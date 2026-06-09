"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { CreateEventSchema, UpdateEventSchema } from "@/lib/validations";
import type { CreateEventInput, UpdateEventInput } from "@/lib/validations";

export async function getEvents(start?: Date, end?: Date) {
  await requireAuth();
  const where: Record<string, unknown> = {};
  if (start && end) {
    where.startTime = { gte: start };
    where.endTime = { lte: end };
  }
  return prisma.calendarEvent.findMany({
    where,
    orderBy: { startTime: "asc" },
  });
}

export async function getUpcomingEvents(limit = 5) {
  await requireAuth();
  return prisma.calendarEvent.findMany({
    where: { startTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
    take: limit,
  });
}

export async function createEvent(data: CreateEventInput) {
  await requireAuth();
  const parsed = CreateEventSchema.parse(data);
  const event = await prisma.calendarEvent.create({ data: parsed });
  revalidatePath("/calendar");
  return event;
}

export async function updateEvent(data: UpdateEventInput) {
  await requireAuth();
  const parsed = UpdateEventSchema.parse(data);
  const { id, ...updateData } = parsed;
  const event = await prisma.calendarEvent.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/calendar");
  return event;
}

export async function deleteEvent(id: string) {
  await requireAuth();
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/calendar");
}
