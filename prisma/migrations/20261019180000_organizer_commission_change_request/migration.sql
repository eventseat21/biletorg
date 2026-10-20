-- Organizatör onay sonrası para modeli (komisyon) değişiklik talebi
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "commissionRequestType" TEXT;
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "commissionRequestValue" DOUBLE PRECISION;
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "commissionRequestNote" TEXT;
ALTER TABLE "organizers" ADD COLUMN IF NOT EXISTS "commissionRequestedAt" TIMESTAMP(3);
