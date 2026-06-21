-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'shopkeeper');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'admin';

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT '#ff2d6d';

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL DEFAULT 'system',
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
