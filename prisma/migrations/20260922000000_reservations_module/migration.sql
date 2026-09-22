-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('link_created', 'pending', 'confirmed', 'needs_fix');

-- CreateEnum
CREATE TYPE "ReservationSource" AS ENUM ('whatsapp', 'instagram', 'referido', 'recurrente', 'otro', 'link');

-- CreateEnum
CREATE TYPE "ReservationPaymentMethod" AS ENUM ('zelle', 'paypal', 'cashapp', 'otro');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "customerName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "idOrPassport" TEXT,
    "driverLicense" TEXT,
    "pickupDate" TIMESTAMP(3),
    "pickupTime" TEXT,
    "dropoffDate" TIMESTAMP(3),
    "dropoffTime" TEXT,
    "pickupLocation" TEXT,
    "dropoffLocation" TEXT,
    "dailyPrice" INTEGER NOT NULL DEFAULT 0,
    "billedDays" INTEGER NOT NULL DEFAULT 0,
    "estimatedTotal" INTEGER NOT NULL DEFAULT 0,
    "reservationDeposit" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" "ReservationPaymentMethod",
    "paymentProofUrl" TEXT,
    "source" "ReservationSource" NOT NULL DEFAULT 'link',
    "status" "ReservationStatus" NOT NULL DEFAULT 'link_created',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationSettings" (
    "id" TEXT NOT NULL,
    "digitalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultDeposit" INTEGER NOT NULL DEFAULT 0,
    "paymentInstructions" TEXT,
    "zelleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "zelleName" TEXT,
    "zelleEmail" TEXT,
    "zellePhone" TEXT,
    "paypalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "paypalEmail" TEXT,
    "paypalLink" TEXT,
    "cashappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cashappTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_code_key" ON "Reservation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_token_key" ON "Reservation"("token");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_vehicleId_idx" ON "Reservation"("vehicleId");

-- CreateIndex
CREATE INDEX "Reservation_createdAt_idx" ON "Reservation"("createdAt");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
