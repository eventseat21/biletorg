-- Event-level commission agreement configured by administrators.
ALTER TABLE "events"
  ADD COLUMN "commissionType" TEXT NOT NULL DEFAULT 'PERCENT_DEDUCT',
  ADD COLUMN "commissionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "commissionLocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "commissionSetAt" TIMESTAMP(3),
  ADD COLUMN "commissionSetBy" TEXT,
  ADD COLUMN "rejectionReason" TEXT;
