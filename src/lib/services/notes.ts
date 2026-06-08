"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { CreateNoteSchema, UpdateNoteSchema } from "@/lib/validations";
import type { CreateNoteInput, UpdateNoteInput } from "@/lib/validations";

export async function getNotes() {
  return prisma.note.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getNoteById(id: string) {
  return prisma.note.findUnique({ where: { id } });
}

export async function createNote(data: CreateNoteInput) {
  const parsed = CreateNoteSchema.parse(data);
  const note = await prisma.note.create({ data: parsed });
  revalidatePath("/");
  revalidatePath("/notes");
  return note;
}

export async function updateNote(data: UpdateNoteInput) {
  const parsed = UpdateNoteSchema.parse(data);
  const { id, ...updateData } = parsed;
  const note = await prisma.note.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/");
  revalidatePath("/notes");
  return note;
}

export async function deleteNote(id: string) {
  await prisma.note.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/notes");
}

export async function togglePinNote(id: string) {
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) throw new Error("Note not found");
  const updated = await prisma.note.update({
    where: { id },
    data: { pinned: !note.pinned },
  });
  revalidatePath("/");
  revalidatePath("/notes");
  return updated;
}
