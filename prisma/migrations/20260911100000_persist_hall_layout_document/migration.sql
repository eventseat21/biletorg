-- Persist the complete editor metadata document on the hall.
ALTER TABLE "halls" ADD COLUMN "layoutJson" JSONB;
