-- AlterTable
ALTER TABLE "DeliveryLocation" ADD COLUMN     "hasFee" BOOLEAN NOT NULL DEFAULT false;

-- Preserve existing behavior: locations that already had a positive fee become
-- explicit "cargo adicional". Free locations (fee = 0) stay free.
UPDATE "DeliveryLocation" SET "hasFee" = true WHERE "deliveryFee" > 0;
