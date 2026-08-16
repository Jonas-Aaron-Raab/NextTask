ALTER TABLE "User"
ADD COLUMN "calendarProvider" TEXT,
ADD COLUMN "calendarEmail" TEXT,
ADD COLUMN "calendarRefreshToken" TEXT,
ADD COLUMN "calendarSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "calendarConnectedAt" TIMESTAMP(3),
ADD COLUMN "calendarLastSyncedAt" TIMESTAMP(3),
ADD COLUMN "calendarSyncError" TEXT;

CREATE TABLE "CalendarSyncEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "externalCalendarId" TEXT NOT NULL,
  "externalEventId" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CalendarSyncEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CalendarSyncEvent_provider_userId_taskId_key" ON "CalendarSyncEvent"("provider", "userId", "taskId");
CREATE INDEX "CalendarSyncEvent_taskId_provider_idx" ON "CalendarSyncEvent"("taskId", "provider");
CREATE INDEX "CalendarSyncEvent_userId_provider_idx" ON "CalendarSyncEvent"("userId", "provider");

ALTER TABLE "CalendarSyncEvent" ADD CONSTRAINT "CalendarSyncEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarSyncEvent" ADD CONSTRAINT "CalendarSyncEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
