-- Add isAirport flag to DeliveryLocation. When true, selecting the location as
-- the rental pickup/dropoff auto-fills the flight arrival/return airport.
ALTER TABLE "DeliveryLocation" ADD COLUMN "isAirport" BOOLEAN NOT NULL DEFAULT false;
