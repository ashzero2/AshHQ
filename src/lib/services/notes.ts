"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { CreateNoteSchema, UpdateNoteSchema } from "@/lib/validations";
import type { CreateNoteInput, UpdateNoteInput } from "@/lib/validations";
import { sanitizeRichText } from "@/lib/sanitize";

export async function getNotes() {
  await requireAuth();
  return prisma.note.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getNoteById(id: string) {
  await requireAuth();
  return prisma.note.findUnique({ where: { id } });
}

export async function createNote(data: CreateNoteInput) {
  await requireAuth();
  const parsed = CreateNoteSchema.parse(data);
  if (parsed.content) parsed.content = sanitizeRichText(parsed.content);
  const note = await prisma.note.create({ data: parsed });
  revalidatePath("/notes");
  return note;
}

export async function updateNote(data: UpdateNoteInput) {
  await requireAuth();
  const parsed = UpdateNoteSchema.parse(data);
  const { id, ...updateData } = parsed;
  if (updateData.content) updateData.content = sanitizeRichText(updateData.content);
  const note = await prisma.note.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/notes");
  return note;
}

export async function deleteNote(id: string) {
  await requireAuth();
  await prisma.note.delete({ where: { id } });
  revalidatePath("/notes");
}

export async function togglePinNote(id: string) {
  await requireAuth();
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) throw new Error("Note not found");
  const updated = await prisma.note.update({
    where: { id },
    data: { pinned: !note.pinned },
  });
  revalidatePath("/notes");
  return updated;
}
