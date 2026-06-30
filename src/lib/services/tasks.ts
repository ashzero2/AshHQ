"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/validations";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations";

export async function getTasks(filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) {
  await requireAuth();
  const where: Record<string, string> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.category) where.category = filters.category;

  return prisma.task.findMany({
    where,
    include: { subtasks: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function getTaskById(id: string) {
  await requireAuth();
  return prisma.task.findUnique({
    where: { id },
    include: { subtasks: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function createSubtask(taskId: string, title: string) {
  await requireAuth();
  const count = await prisma.subtask.count({ where: { taskId } });
  const subtask = await prisma.subtask.create({
    data: { taskId, title: title.trim(), sortOrder: count },
  });
  revalidatePath("/tasks");
  return subtask;
}

export async function toggleSubtask(id: string) {
  await requireAuth();
  const sub = await prisma.subtask.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.subtask.update({
    where: { id },
    data: { completed: !sub.completed },
  });
  revalidatePath("/tasks");
  return updated;
}

export async function deleteSubtask(id: string) {
  await requireAuth();
  await prisma.subtask.delete({ where: { id } });
  revalidatePath("/tasks");
}

export async function createTask(data: CreateTaskInput) {
  await requireAuth();
  const parsed = CreateTaskSchema.parse(data);
  const task = await prisma.task.create({ data: parsed });
  revalidatePath("/tasks");
  return task;
}

export async function updateTask(data: UpdateTaskInput) {
  await requireAuth();
  const parsed = UpdateTaskSchema.parse(data);
  const { id, ...updateData } = parsed;

  // Auto-set completedAt when status changes to DONE
  if (updateData.status === "DONE" && !updateData.completedAt) {
    updateData.completedAt = new Date();
  }
  if (updateData.status && updateData.status !== "DONE") {
    updateData.completedAt = null;
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/tasks");
  return task;
}

export async function deleteTask(id: string) {
  await requireAuth();
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
}

export async function getTaskStats() {
  await requireAuth();
  const now = new Date();
  const [total, completed, inProgress, overdue] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.task.count({ where: { status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { status: { not: "DONE" }, dueDate: { lt: now } } }),
  ]);
  return { total, completed, inProgress, overdue };
}
