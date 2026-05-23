-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'QA', 'DESIGNER', 'MARKETING');

-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'QA', 'BLOCKED', 'DONE');
ALTER TABLE "Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus_new" USING (
  CASE
    WHEN "status"::text = 'TODAY' THEN 'OPEN'
    WHEN "status"::text = 'THIS_WEEK' THEN 'IN_PROGRESS'
    WHEN "status"::text = 'LATER' THEN 'OPEN'
    WHEN "status"::text = 'DONE' THEN 'DONE'
    ELSE 'OPEN'
  END::"TaskStatus_new"
);
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "TaskStatus_old";
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'DEVELOPER',
ADD COLUMN "department" TEXT NOT NULL DEFAULT 'Development';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "color" TEXT,
ADD COLUMN "deadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "endDate" TIMESTAMP(3),
ADD COLUMN "estimatedHours" DOUBLE PRECISION,
ADD COLUMN "department" TEXT;
