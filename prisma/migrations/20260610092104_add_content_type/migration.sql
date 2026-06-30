-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "contentType" TEXT NOT NULL DEFAULT 'plaintext',
    "mood" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_JournalEntry" ("content", "createdAt", "date", "id", "mood", "updatedAt") SELECT "content", "createdAt", "date", "id", "mood", "updatedAt" FROM "JournalEntry";
DROP TABLE "JournalEntry";
ALTER TABLE "new_JournalEntry" RENAME TO "JournalEntry";
CREATE UNIQUE INDEX "JournalEntry_date_key" ON "JournalEntry"("date");
CREATE INDEX "JournalEntry_date_idx" ON "JournalEntry"("date");
CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "contentType" TEXT NOT NULL DEFAULT 'plaintext',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Note" ("content", "createdAt", "id", "pinned", "title", "updatedAt") SELECT "content", "createdAt", "id", "pinned", "title", "updatedAt" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE INDEX "Note_pinned_idx" ON "Note"("pinned");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
