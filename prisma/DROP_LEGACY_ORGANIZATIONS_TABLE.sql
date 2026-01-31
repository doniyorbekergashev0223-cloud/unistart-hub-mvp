-- Legacy table cleanup: remove unused lowercase "organizations" table.
--
-- CONTEXT:
-- - Prisma uses the "Organization" table (capital O) only.
-- - This app does NOT use the "organizations" (lowercase) table anywhere.
-- - The lowercase table can cause confusion when debugging registration and analytics.
--
-- VERIFIED:
-- - prisma/schema.prisma: single model Organization (no @@map to "organizations").
-- - All APIs use prisma.organization (Organization model) or user.organization / organizationId.
-- - No Prisma model, API, or query references the "organizations" table.
--
-- DO NOT touch the "Organization" table or User.organizationId logic.
-- Run this in Supabase SQL Editor (or your PostgreSQL client) when ready.

DROP TABLE IF EXISTS public.organizations CASCADE;
