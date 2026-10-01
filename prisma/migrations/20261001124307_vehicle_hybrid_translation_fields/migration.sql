-- CreateEnum
CREATE TYPE "TranslationStatus" AS ENUM ('missing', 'auto', 'manual');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "descriptionEnStatus" "TranslationStatus" NOT NULL DEFAULT 'missing',
ADD COLUMN     "descriptionEnUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "featuresEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "featuresEnStatus" "TranslationStatus" NOT NULL DEFAULT 'missing',
ADD COLUMN     "featuresEnUpdatedAt" TIMESTAMP(3);
