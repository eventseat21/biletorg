-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

-- AlterTable
ALTER TABLE "organizers" ADD COLUMN "organizationDisplayName" TEXT;

-- CreateTable
CREATE TABLE "ticket_checkers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_checkers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ticket_checkers_userId_key" ON "ticket_checkers"("userId");

ALTER TABLE "ticket_checkers" ADD CONSTRAINT "ticket_checkers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
