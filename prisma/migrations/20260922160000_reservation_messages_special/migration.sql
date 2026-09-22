-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "specialRequest" TEXT,
ADD COLUMN     "statusMessage" TEXT,
ADD COLUMN     "statusMessageVisible" BOOLEAN NOT NULL DEFAULT false;
