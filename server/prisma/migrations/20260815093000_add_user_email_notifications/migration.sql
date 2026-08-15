ALTER TABLE "User"
ADD COLUMN "notificationEmail" TEXT,
ADD COLUMN "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false;
