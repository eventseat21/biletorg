-- Admin onayında organizatör para modeli + organizatörün com yayını talebi
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "commissionType" TEXT;
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "commissionValue" DOUBLE PRECISION;

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "publishComRequested" BOOLEAN NOT NULL DEFAULT false;
