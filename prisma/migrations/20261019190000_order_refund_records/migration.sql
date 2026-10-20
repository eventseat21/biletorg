-- Sipariş iade kaydı
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refundReason" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT;
