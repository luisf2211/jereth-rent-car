-- =============================================================================
-- SECURITY HARDENING (storage): private bucket for sensitive client documents
-- -----------------------------------------------------------------------------
-- The `media` bucket is PUBLIC and mixes truly public assets (vehicle photos,
-- branding, delivery-location images) with sensitive client documents
-- (payment proofs, flight itineraries, reservation confirmation PDFs). A
-- public bucket exposes any object to anyone who learns/guesses its URL.
--
-- This migration provisions a SEPARATE, PRIVATE bucket `client-docs` for
-- sensitive documents. `media` stays public and untouched, so existing public
-- images keep working. New sensitive uploads go to `client-docs`, which is not
-- publicly readable; the app serves them via short-lived signed URLs generated
-- server-side with the service_role key (never exposed to the browser).
--
-- Access model for `client-docs`:
--   * public = false  -> no anonymous public URL works.
--   * NO policies for anon/authenticated on storage.objects for this bucket,
--     so the PostgREST/storage API cannot list or read it.
--   * The app uses the service_role key (bypasses RLS) to upload and to mint
--     signed URLs. service_role is server-only.
--
-- Idempotent and non-destructive: creates the bucket only if missing, changes
-- no existing objects, deletes nothing.
--
-- NOTE: the `storage` schema is a Supabase-managed schema that does NOT exist
-- in Prisma's ephemeral "shadow database". The whole body runs inside a DO
-- block that swallows the "undefined_table / invalid_schema_name" errors so
-- `prisma migrate dev` can still validate this migration against the shadow DB
-- (where it becomes a no-op). Against the real Supabase database the schema
-- exists and the bucket is provisioned normally.
-- =============================================================================

DO $$
BEGIN
  -- Create the private bucket if it doesn't exist yet.
  -- file_size_limit: 10MB (PDFs + images). allowed_mime_types: images + pdf.
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'client-docs',
    'client-docs',
    false,
    10485760,
    ARRAY['image/png','image/jpeg','image/webp','image/gif','application/pdf']
  )
  ON CONFLICT (id) DO NOTHING;

  -- Defense in depth: ensure the bucket is private even if it somehow pre-existed
  -- as public. This only flips the visibility flag; it does not touch objects.
  UPDATE storage.buckets SET public = false WHERE id = 'client-docs' AND public = true;
EXCEPTION
  WHEN undefined_table OR invalid_schema_name THEN
    -- Shadow database (no Supabase `storage` schema): treat as a no-op.
    RAISE NOTICE 'storage schema not present; skipping private bucket provisioning (shadow DB).';
END $$;
