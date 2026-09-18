-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('economico', 'compacto', 'sedan', 'suv', 'suv_grande', 'premium');

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "aboutText" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "googleMapsUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "category" "VehicleCategory" NOT NULL DEFAULT 'economico',
ADD COLUMN     "orSimilar" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "highlighted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'google',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Requirement_isActive_sortOrder_idx" ON "Requirement"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "DeliveryLocation_isActive_sortOrder_idx" ON "DeliveryLocation"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "FaqItem_isActive_sortOrder_idx" ON "FaqItem"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Review_isActive_sortOrder_idx" ON "Review"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Vehicle_category_idx" ON "Vehicle"("category");
