-- Add project master data needed for bank-style status reports.
ALTER TABLE "Project"
ADD COLUMN "businessArea" TEXT,
ADD COLUMN "projectGoal" TEXT,
ADD COLUMN "plannedStart" TIMESTAMP(3),
ADD COLUMN "plannedEnd" TIMESTAMP(3),
ADD COLUMN "deputyLead" TEXT,
ADD COLUMN "projectSponsor" TEXT,
ADD COLUMN "plannedEffortPt" DOUBLE PRECISION,
ADD COLUMN "plannedBudget" DOUBLE PRECISION,
ADD COLUMN "keyInterfaces" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "collaborationQuality" TEXT,
ADD COLUMN "reportCycle" TEXT NOT NULL DEFAULT 'MONTHLY';

CREATE TABLE "ProjectMilestone" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "planDate" TIMESTAMP(3),
  "newDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "statusNote" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "projectId" TEXT NOT NULL,

  CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectRisk" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "impact" INTEGER,
  "probability" INTEGER,
  "riskClass" TEXT,
  "trend" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "projectId" TEXT NOT NULL,

  CONSTRAINT "ProjectRisk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectBudgetLine" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "plannedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "projectId" TEXT NOT NULL,

  CONSTRAINT "ProjectBudgetLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectStatusReport" (
  "id" TEXT NOT NULL,
  "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextMeetingDate" TIMESTAMP(3),
  "reportingPeriod" TEXT,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "goalStatus" TEXT,
  "scheduleStatus" TEXT,
  "resourceStatus" TEXT,
  "budgetStatus" TEXT,
  "progressNote" TEXT,
  "goalNote" TEXT,
  "scheduleNote" TEXT,
  "resourceNote" TEXT,
  "budgetNote" TEXT,
  "riskChanges" TEXT,
  "interfaceChanges" TEXT,
  "collaborationQuality" TEXT,
  "nextSteps" TEXT,
  "actualEffortPt" DOUBLE PRECISION,
  "actualBudget" DOUBLE PRECISION,
  "versionLabel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "projectId" TEXT NOT NULL,
  "authorId" TEXT,

  CONSTRAINT "ProjectStatusReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectMilestone_projectId_order_idx" ON "ProjectMilestone"("projectId", "order");
CREATE INDEX "ProjectRisk_projectId_active_idx" ON "ProjectRisk"("projectId", "active");
CREATE INDEX "ProjectBudgetLine_projectId_order_idx" ON "ProjectBudgetLine"("projectId", "order");
CREATE INDEX "ProjectStatusReport_projectId_reportDate_idx" ON "ProjectStatusReport"("projectId", "reportDate");
CREATE INDEX "ProjectStatusReport_authorId_createdAt_idx" ON "ProjectStatusReport"("authorId", "createdAt");

ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectRisk" ADD CONSTRAINT "ProjectRisk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectBudgetLine" ADD CONSTRAINT "ProjectBudgetLine_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectStatusReport" ADD CONSTRAINT "ProjectStatusReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectStatusReport" ADD CONSTRAINT "ProjectStatusReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
