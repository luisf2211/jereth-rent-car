-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Vehicle_isActive_viewCount_idx" ON "Vehicle"("isActive", "viewCount");
