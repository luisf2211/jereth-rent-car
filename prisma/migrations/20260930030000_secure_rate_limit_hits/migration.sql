-- =============================================================================
-- SECURITY: apply the same RLS + revoke posture to the new RateLimitHit table.
-- -----------------------------------------------------------------------------
-- The RateLimitHit table was just created. Even though ALTER DEFAULT PRIVILEGES
-- (from the earlier RLS migration) should already have kept anon/authenticated
-- from receiving grants, we enforce the deny-by-default posture EXPLICITLY here
-- so this table matches every other public table: RLS enabled + forced, and no
-- privileges for the PostgREST API roles. Prisma (role `postgres`, BYPASSRLS)
-- and service_role are unaffected. Idempotent and non-destructive.
-- =============================================================================

ALTER TABLE public."RateLimitHit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RateLimitHit" FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON public."RateLimitHit" FROM anon;
REVOKE ALL PRIVILEGES ON public."RateLimitHit" FROM authenticated;
