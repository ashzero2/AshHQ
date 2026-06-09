"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { CreateTransactionSchema, CreateBudgetSchema } from "@/lib/validations";
import type { CreateTransactionInput, CreateBudgetInput } from "@/lib/validations";

export async function getTransactions(filters?: {
  type?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  await requireAuth();
  const where: Record<string, unknown> = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.category) where.category = filters.category;
  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) (where.date as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.date as Record<string, unknown>).lte = filters.endDate;
  }
  return prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });
}

export async function createTransaction(data: CreateTransactionInput) {
  await requireAuth();
  const parsed = CreateTransactionSchema.parse(data);
  const tx = await prisma.transaction.create({ data: parsed });
  revalidatePath("/finance");
  return tx;
}

export async function deleteTransaction(id: string) {
  await requireAuth();
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/finance");
}

export async function getFinanceSummary(month: number, year: number) {
  await requireAuth();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: startDate, lte: endDate } },
  });

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const expensesByCategory = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const byCategory = Object.entries(expensesByCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
  }));

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    byCategory,
  };
}

export async function getBudgets(month: number, year: number) {
  await requireAuth();
  return prisma.budget.findMany({ where: { month, year } });
}

export async function createBudget(data: CreateBudgetInput) {
  await requireAuth();
  const parsed = CreateBudgetSchema.parse(data);
  const budget = await prisma.budget.upsert({
    where: {
      category_month_year: {
        category: parsed.category,
        month: parsed.month,
        year: parsed.year,
      },
    },
    update: { amount: parsed.amount },
    create: parsed,
  });
  revalidatePath("/finance");
  return budget;
}

export async function deleteBudget(id: string) {
  await requireAuth();
  await prisma.budget.delete({ where: { id } });
  revalidatePath("/finance");
}
