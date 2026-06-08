"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { CreateQuickLinkSchema } from "@/lib/validations";
import type { CreateQuickLinkInput } from "@/lib/validations";

export async function getLinks() {
  return prisma.quickLink.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function createLink(data: CreateQuickLinkInput) {
  const parsed = CreateQuickLinkSchema.parse(data);
  const link = await prisma.quickLink.create({ data: parsed });
  revalidatePath("/");
  return link;
}

export async function updateLink(id: string, data: Partial<CreateQuickLinkInput>) {
  const link = await prisma.quickLink.update({
    where: { id },
    data,
  });
  revalidatePath("/");
  return link;
}

export async function deleteLink(id: string) {
  await prisma.quickLink.delete({ where: { id } });
  revalidatePath("/");
}
