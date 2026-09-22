-- Add "web" origin to ReservationSource ("Página web").
-- Additive-only change: adds a new enum value without touching existing data.
ALTER TYPE "ReservationSource" ADD VALUE IF NOT EXISTS 'web';
