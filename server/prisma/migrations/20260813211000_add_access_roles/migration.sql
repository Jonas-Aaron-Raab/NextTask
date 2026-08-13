-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AccessRoleKind" AS ENUM ('ADMIN', 'GBL', 'MEMBER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AccessRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "AccessRoleKind" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "businessAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "departmentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "permissions" JSONB NOT NULL,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AccessRole_code_key" ON "AccessRole"("code");

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessRoleId" TEXT;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_accessRoleId_fkey" FOREIGN KEY ("accessRoleId") REFERENCES "AccessRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
