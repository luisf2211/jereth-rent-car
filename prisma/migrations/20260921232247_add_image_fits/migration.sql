-- Reconciliation: imageFits already applied to DB; idempotent for local history.
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "imageFits" JSONB;
