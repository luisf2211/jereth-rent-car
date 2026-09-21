-- Add imageFits column to Vehicle.
-- Stores per-photo framing data as JSON: { [key: string]: { x: number, y: number, zoom: number } }
-- Keys are photo URLs, "cover", or "carousel". Null = no custom framing (defaults to center/cover).
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "imageFits" JSONB;
