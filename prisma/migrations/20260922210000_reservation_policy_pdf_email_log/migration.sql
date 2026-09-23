-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "confirmationPdfUrl" TEXT,
ADD COLUMN     "confirmationSnapshot" JSONB,
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "policyAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "policyAcceptedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ReservationEmailLog" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationEmailLog_reservationId_idx" ON "ReservationEmailLog"("reservationId");

-- CreateIndex
CREATE INDEX "ReservationEmailLog_type_idx" ON "ReservationEmailLog"("type");

-- AddForeignKey
ALTER TABLE "ReservationEmailLog" ADD CONSTRAINT "ReservationEmailLog_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
