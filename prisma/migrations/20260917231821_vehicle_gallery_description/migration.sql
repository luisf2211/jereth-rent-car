-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "description" TEXT,
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
