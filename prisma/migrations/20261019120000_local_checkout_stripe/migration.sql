-- kurdevents.org üzerinde yerel bilet satışı (Stripe Checkout)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ(3);

CREATE UNIQUE INDEX IF NOT EXISTS "orders_stripeSessionId_key" ON "orders"("stripeSessionId");

ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "code" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "tickets_code_key" ON "tickets"("code");
