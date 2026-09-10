-- Persist seat-map metadata used by the editor.
ALTER TABLE "seats"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'available',
  ADD COLUMN "price" DOUBLE PRECISION,
  ADD COLUMN "zone" TEXT,
  ADD COLUMN "blockId" TEXT,
  ADD COLUMN "sectionId" TEXT;

CREATE INDEX "seats_hallId_blockId_idx" ON "seats"("hallId", "blockId");
CREATE INDEX "seats_hallId_zone_idx" ON "seats"("hallId", "zone");
