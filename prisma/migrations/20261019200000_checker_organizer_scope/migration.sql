-- Kontrolör etkinlik yetkisi: her kontrolör bir organizatöre atanır.
ALTER TABLE "ticket_checkers" ADD COLUMN IF NOT EXISTS "organizerId" TEXT;

CREATE INDEX IF NOT EXISTS "ticket_checkers_organizerId_idx" ON "ticket_checkers"("organizerId");

DO $$ BEGIN
  ALTER TABLE "ticket_checkers"
    ADD CONSTRAINT "ticket_checkers_organizerId_fkey"
    FOREIGN KEY ("organizerId") REFERENCES "organizers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;
