-- CreateTable
CREATE TABLE "seat_categories" (
    "id" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "seat_categories_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "seat_categories_hallId_idx" ON "seat_categories"("hallId");
