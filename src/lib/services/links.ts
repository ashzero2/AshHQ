"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { CreateQuickLinkSchema } from "@/lib/validations";
import type { CreateQuickLinkInput } from "@/lib/validations";

export async function getLinks() {
  await requireAuth();
  return prisma.quickLink.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function createLink(data: CreateQuickLinkInput) {
  await requireAuth();
  const parsed = CreateQuickLinkSchema.parse(data);
  const link = await prisma.quickLink.create({ data: parsed });
  revalidatePath("/links");
  return link;
}

export async function updateLink(id: string, data: Partial<CreateQuickLinkInput>) {
  await requireAuth();
  const link = await prisma.quickLink.update({
    where: { id },
    data,
  });
  revalidatePath("/links");
  return link;
}

export async function deleteLink(id: string) {
  await requireAuth();
  await prisma.quickLink.delete({ where: { id } });
  revalidatePath("/links");
}
