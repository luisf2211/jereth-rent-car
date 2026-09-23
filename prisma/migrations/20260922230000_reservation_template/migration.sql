-- CreateTable
CREATE TABLE "ReservationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Plantilla de reserva',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationTemplate_status_idx" ON "ReservationTemplate"("status");
