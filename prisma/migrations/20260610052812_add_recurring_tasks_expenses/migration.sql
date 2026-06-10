-- AlterTable
ALTER TABLE "Task" ADD COLUMN "recurringTaskId" TEXT;
ALTER TABLE "Task" ADD COLUMN "reminderAt" DATETIME;

-- CreateTable
CREATE TABLE "RecurringTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "daysOfWeek" TEXT,
    "dayOfMonth" INTEGER,
    "cronExpr" TEXT,
    "nextDueAt" DATETIME NOT NULL,
    "lastRunAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "dayOfMonth" INTEGER,
    "nextDueAt" DATETIME NOT NULL,
    "lastPaidAt" DATETIME,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "RecurringTask_nextDueAt_idx" ON "RecurringTask"("nextDueAt");

-- CreateIndex
CREATE INDEX "RecurringTask_status_idx" ON "RecurringTask"("status");

-- CreateIndex
CREATE INDEX "RecurringExpense_nextDueAt_idx" ON "RecurringExpense"("nextDueAt");

-- CreateIndex
CREATE INDEX "RecurringExpense_status_idx" ON "RecurringExpense"("status");

-- CreateIndex
CREATE INDEX "Task_recurringTaskId_idx" ON "Task"("recurringTaskId");
