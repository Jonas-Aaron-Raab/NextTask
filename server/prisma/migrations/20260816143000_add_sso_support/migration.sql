ALTER TABLE "User"
ADD COLUMN "authProvider" TEXT NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "ssoProvider" TEXT,
ADD COLUMN "ssoSubject" TEXT,
ADD COLUMN "ssoEmail" TEXT,
ADD COLUMN "ssoLastLoginAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_ssoProvider_ssoSubject_key" ON "User"("ssoProvider", "ssoSubject");

CREATE TABLE "SsoLoginTicket" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SsoLoginTicket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SsoLoginTicket_tokenHash_key" ON "SsoLoginTicket"("tokenHash");
CREATE INDEX "SsoLoginTicket_expiresAt_idx" ON "SsoLoginTicket"("expiresAt");
CREATE INDEX "SsoLoginTicket_userId_createdAt_idx" ON "SsoLoginTicket"("userId", "createdAt");

ALTER TABLE "SsoLoginTicket" ADD CONSTRAINT "SsoLoginTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
