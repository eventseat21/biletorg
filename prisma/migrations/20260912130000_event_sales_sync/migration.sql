-- External sales-platform synchronization metadata for kurdevents.com.
ALTER TABLE "events"
  ADD COLUMN "salesEventId" TEXT,
  ADD COLUMN "salesPlanId" TEXT,
  ADD COLUMN "salesVenueId" TEXT,
  ADD COLUMN "salesSyncedAt" TIMESTAMP(3),
  ADD COLUMN "salesSyncStatus" TEXT,
  ADD COLUMN "salesSyncError" TEXT;

CREATE INDEX "events_salesEventId_idx" ON "events"("salesEventId");
CREATE INDEX "events_salesSyncStatus_idx" ON "events"("salesSyncStatus");
