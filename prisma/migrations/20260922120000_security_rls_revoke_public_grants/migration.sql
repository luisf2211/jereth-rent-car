-- =============================================================================
-- SECURITY HARDENING: RLS + minimum-privilege grants for the public schema
-- -----------------------------------------------------------------------------
-- Context: The Supabase Security Advisor flagged "RLS Disabled in Public" and
-- "Sensitive Columns Exposed" on public tables (Reservation, User, etc.). The
-- root cause is that the PostgREST API roles `anon` and `authenticated` held
-- full table privileges (SELECT/INSERT/UPDATE/DELETE/...) on every table in the
-- `public` schema, and Row Level Security was OFF. This let anyone with the
-- public anon key read PII (customer data, tokens) and even password hashes via
-- the auto-generated REST API (/rest/v1/...).
--
-- This application does NOT use the PostgREST/supabase-js data API for any
-- table reads or writes. All data access goes through Prisma, which connects as
-- the `postgres` role over a direct/pooled Postgres connection and therefore
-- BYPASSES both PostgREST and RLS. Supabase Storage is accessed only with the
-- `service_role` key. Consequently, removing the `anon`/`authenticated` grants
-- and enabling RLS (deny-by-default, no policies) closes the public API hole
-- WITHOUT affecting the application.
--
-- Design choices:
--   * No broad "USING (true)" policies are created. RLS is enabled with NO
--     policies so the default is deny-all for anyone subject to RLS. The
--     `postgres` (Prisma) and `service_role` connections are not restricted by
--     RLS the way anon/authenticated are, so the app keeps working.
--   * All privileges are REVOKED from `anon` and `authenticated` at the table
--     level. Default privileges for future tables are also locked down.
--   * `service_role` and `postgres` privileges are left untouched.
--   * Idempotent: safe to re-run. Uses catalog-driven DO blocks.
--
-- This migration performs NO destructive DDL (no DROP/TRUNCATE, no data change).
-- =============================================================================

-- 1) Enable Row Level Security on every base table in the public schema.
--    No policies are added => default deny for RLS-subject roles.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    -- FORCE also subjects the table owner to RLS for defense in depth.
    -- Prisma connects as `postgres` (a superuser/bypassrls role in Supabase),
    -- which is exempt from FORCE, so the app is unaffected.
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

-- 2) Revoke ALL privileges on existing public tables/sequences from the
--    PostgREST API roles. This removes REST read/write access entirely.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON public.%I FROM anon;', r.tablename);
    EXECUTE format('REVOKE ALL PRIVILEGES ON public.%I FROM authenticated;', r.tablename);
  END LOOP;
END $$;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- 3) Prevent the API roles from even resolving objects in the schema.
--    (USAGE alone does not grant table access, but revoking it is defense in
--     depth against future accidental grants.)
REVOKE USAGE ON SCHEMA public FROM anon;
REVOKE USAGE ON SCHEMA public FROM authenticated;

-- 4) Lock down DEFAULT PRIVILEGES so future objects created by `postgres` do
--    NOT automatically become accessible to anon/authenticated.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM authenticated;

-- service_role and postgres are intentionally NOT modified. Storage access
-- (service_role) and Prisma access (postgres) continue to work as before.
