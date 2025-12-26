/*
  Warnings:

  - You are about to drop the column `diagnosedAt` on the `DiagnosedCondition` table. All the data in the column will be lost.
  - You are about to drop the column `icdCode` on the `DiagnosedCondition` table. All the data in the column will be lost.
  - You are about to drop the column `conditionId` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `hour` on the `MedicationSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `minute` on the `MedicationSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `timeOfDay` on the `MedicationSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - Added the required column `frequency` to the `MedicationSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeSlot` to the `MedicationSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timing` to the `MedicationSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "_DiagnosedConditionToMedication" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DiagnosedConditionToMedication_A_fkey" FOREIGN KEY ("A") REFERENCES "DiagnosedCondition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DiagnosedConditionToMedication_B_fkey" FOREIGN KEY ("B") REFERENCES "Medication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiagnosedCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DiagnosedCondition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DiagnosedCondition" ("createdAt", "id", "name", "note", "updatedAt", "userId") SELECT "createdAt", "id", "name", "note", "updatedAt", "userId" FROM "DiagnosedCondition";
DROP TABLE "DiagnosedCondition";
ALTER TABLE "new_DiagnosedCondition" RENAME TO "DiagnosedCondition";
CREATE INDEX "DiagnosedCondition_userId_idx" ON "DiagnosedCondition"("userId");
CREATE TABLE "new_Medication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Medication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Medication" ("createdAt", "id", "name", "updatedAt", "userId") SELECT "createdAt", "id", "name", "updatedAt", "userId" FROM "Medication";
DROP TABLE "Medication";
ALTER TABLE "new_Medication" RENAME TO "Medication";
CREATE INDEX "Medication_userId_idx" ON "Medication"("userId");
CREATE TABLE "new_MedicationSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medicationId" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "timing" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MedicationSchedule_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MedicationSchedule" ("createdAt", "id", "medicationId", "note", "updatedAt") SELECT "createdAt", "id", "medicationId", "note", "updatedAt" FROM "MedicationSchedule";
DROP TABLE "MedicationSchedule";
ALTER TABLE "new_MedicationSchedule" RENAME TO "MedicationSchedule";
CREATE INDEX "MedicationSchedule_medicationId_idx" ON "MedicationSchedule"("medicationId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "id", "updatedAt") SELECT "createdAt", "id", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_DiagnosedConditionToMedication_AB_unique" ON "_DiagnosedConditionToMedication"("A", "B");

-- CreateIndex
CREATE INDEX "_DiagnosedConditionToMedication_B_index" ON "_DiagnosedConditionToMedication"("B");
