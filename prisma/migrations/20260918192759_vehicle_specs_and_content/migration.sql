-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('gasolina', 'diesel', 'hibrido', 'electrico');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "doors" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "fuelType" "FuelType" NOT NULL DEFAULT 'gasolina';

-- CreateTable
CREATE TABLE "Inclusion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inclusion_isActive_sortOrder_idx" ON "Inclusion"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Policy_isActive_sortOrder_idx" ON "Policy"("isActive", "sortOrder");
