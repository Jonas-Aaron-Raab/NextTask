-- Persist previously client-only display content as first-class application data.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationEmail" TEXT;

CREATE TABLE IF NOT EXISTS "Department" (
  "id" TEXT NOT NULL,
  "code" TEXT,
  "name" TEXT NOT NULL,
  "businessArea" TEXT,
  "leadName" TEXT NOT NULL,
  "memberCount" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT NOT NULL DEFAULT '',
  "accent" TEXT NOT NULL DEFAULT 'border-slate-300 bg-[#fff4f6]',
  "badgeTone" TEXT NOT NULL DEFAULT 'bg-[#fff0f2] text-[#b84758]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leadId" TEXT,

  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DepartmentMember" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "roleLabel" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "departmentId" TEXT NOT NULL,
  "userId" TEXT,

  CONSTRAINT "DepartmentMember_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "departmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "visibility" TEXT,
  ADD COLUMN IF NOT EXISTS "statusLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "projectType" TEXT;

ALTER TABLE "ProjectRisk" ADD COLUMN IF NOT EXISTS "measure" TEXT;

CREATE TABLE IF NOT EXISTS "ProjectInterface" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Offen',
  "comment" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "projectId" TEXT NOT NULL,

  CONSTRAINT "ProjectInterface_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjectApproval" (
  "id" TEXT NOT NULL,
  "projectResponsible" TEXT,
  "gbl" TEXT,
  "projectLead" TEXT,
  "approvalDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "projectId" TEXT NOT NULL,

  CONSTRAINT "ProjectApproval_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "ticketNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "progress" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "checklist" TEXT,
  ADD COLUMN IF NOT EXISTS "note" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceTaskId" TEXT,
  ADD COLUMN IF NOT EXISTS "parentTaskId" TEXT;

CREATE TABLE IF NOT EXISTS "TaskAssignmentSource" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "initials" TEXT,
  "tone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskId" TEXT NOT NULL,

  CONSTRAINT "TaskAssignmentSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TaskTag" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskId" TEXT NOT NULL,

  CONSTRAINT "TaskTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TaskPersonLink" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskId" TEXT NOT NULL,

  CONSTRAINT "TaskPersonLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TaskAttachment" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "owner" TEXT,
  "url" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskId" TEXT NOT NULL,

  CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TaskCompliance" (
  "id" TEXT NOT NULL,
  "classification" TEXT NOT NULL DEFAULT 'Intern',
  "risk" TEXT NOT NULL DEFAULT 'Niedrig',
  "controlId" TEXT,
  "approval" TEXT,
  "evidence" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskId" TEXT NOT NULL,

  CONSTRAINT "TaskCompliance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TaskAuditEntry" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskId" TEXT NOT NULL,

  CONSTRAINT "TaskAuditEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Document" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "classification" TEXT NOT NULL,
  "ownerName" TEXT NOT NULL,
  "version" TEXT,
  "reviewDate" TIMESTAMP(3),
  "retentionDate" TIMESTAMP(3),
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "departmentId" TEXT,
  "projectId" TEXT,

  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentTaskLink" (
  "id" TEXT NOT NULL,
  "taskTitle" TEXT NOT NULL,
  "taskId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "documentId" TEXT NOT NULL,

  CONSTRAINT "DocumentTaskLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentControl" (
  "id" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "documentId" TEXT NOT NULL,

  CONSTRAINT "DocumentControl_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentAuditEntry" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "documentId" TEXT NOT NULL,

  CONSTRAINT "DocumentAuditEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentTemplate" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'Vorlage',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Department_code_key" ON "Department"("code");
CREATE INDEX IF NOT EXISTS "Department_businessArea_idx" ON "Department"("businessArea");
CREATE INDEX IF NOT EXISTS "Department_leadId_idx" ON "Department"("leadId");
CREATE UNIQUE INDEX IF NOT EXISTS "DepartmentMember_departmentId_name_key" ON "DepartmentMember"("departmentId", "name");
CREATE INDEX IF NOT EXISTS "DepartmentMember_departmentId_order_idx" ON "DepartmentMember"("departmentId", "order");
CREATE INDEX IF NOT EXISTS "DepartmentMember_userId_idx" ON "DepartmentMember"("userId");
CREATE INDEX IF NOT EXISTS "Project_departmentId_idx" ON "Project"("departmentId");
CREATE INDEX IF NOT EXISTS "ProjectInterface_projectId_order_idx" ON "ProjectInterface"("projectId", "order");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectApproval_projectId_key" ON "ProjectApproval"("projectId");
CREATE INDEX IF NOT EXISTS "Task_projectId_status_order_idx" ON "Task"("projectId", "status", "order");
CREATE INDEX IF NOT EXISTS "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX IF NOT EXISTS "Task_parentTaskId_idx" ON "Task"("parentTaskId");
CREATE INDEX IF NOT EXISTS "Task_ticketNumber_idx" ON "Task"("ticketNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "TaskAssignmentSource_taskId_key" ON "TaskAssignmentSource"("taskId");
CREATE UNIQUE INDEX IF NOT EXISTS "TaskTag_taskId_label_key" ON "TaskTag"("taskId", "label");
CREATE INDEX IF NOT EXISTS "TaskTag_label_idx" ON "TaskTag"("label");
CREATE UNIQUE INDEX IF NOT EXISTS "TaskPersonLink_taskId_name_key" ON "TaskPersonLink"("taskId", "name");
CREATE INDEX IF NOT EXISTS "TaskAttachment_taskId_idx" ON "TaskAttachment"("taskId");
CREATE UNIQUE INDEX IF NOT EXISTS "TaskCompliance_taskId_key" ON "TaskCompliance"("taskId");
CREATE INDEX IF NOT EXISTS "TaskAuditEntry_taskId_order_idx" ON "TaskAuditEntry"("taskId", "order");
CREATE INDEX IF NOT EXISTS "Document_departmentId_idx" ON "Document"("departmentId");
CREATE INDEX IF NOT EXISTS "Document_projectId_idx" ON "Document"("projectId");
CREATE INDEX IF NOT EXISTS "Document_type_idx" ON "Document"("type");
CREATE INDEX IF NOT EXISTS "Document_status_idx" ON "Document"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentTaskLink_documentId_taskTitle_key" ON "DocumentTaskLink"("documentId", "taskTitle");
CREATE INDEX IF NOT EXISTS "DocumentTaskLink_taskId_idx" ON "DocumentTaskLink"("taskId");
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentControl_documentId_controlId_key" ON "DocumentControl"("documentId", "controlId");
CREATE INDEX IF NOT EXISTS "DocumentControl_controlId_idx" ON "DocumentControl"("controlId");
CREATE INDEX IF NOT EXISTS "DocumentAuditEntry_documentId_order_idx" ON "DocumentAuditEntry"("documentId", "order");
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentTemplate_title_key" ON "DocumentTemplate"("title");

DO $$ BEGIN
  ALTER TABLE "Department" ADD CONSTRAINT "Department_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DepartmentMember" ADD CONSTRAINT "DepartmentMember_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Project" ADD CONSTRAINT "Project_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectInterface" ADD CONSTRAINT "ProjectInterface_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectApproval" ADD CONSTRAINT "ProjectApproval_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TaskAssignmentSource" ADD CONSTRAINT "TaskAssignmentSource_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TaskPersonLink" ADD CONSTRAINT "TaskPersonLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TaskCompliance" ADD CONSTRAINT "TaskCompliance_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TaskAuditEntry" ADD CONSTRAINT "TaskAuditEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Document" ADD CONSTRAINT "Document_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DocumentTaskLink" ADD CONSTRAINT "DocumentTaskLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DocumentControl" ADD CONSTRAINT "DocumentControl_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DocumentAuditEntry" ADD CONSTRAINT "DocumentAuditEntry_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
