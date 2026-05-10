-- P18.B: persist keyword suggestions independently from geo_analysis.
--
-- Before P18 they lived inside geo_analysis JSONB; that coupling
-- meant the slow geo-analyze response had to complete before they
-- could be persisted. Splitting them lets the dedicated
-- /api/keyword-suggestions endpoint persist them as soon as the LLM
-- responds (~5-10s instead of 27s).
--
-- ⚠️ Already applied to prod on 2026-05-10 via mcp__supabase__apply_migration.
-- Idempotent (uses IF NOT EXISTS) so re-running is safe.
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS keyword_suggestions JSONB;

COMMENT ON COLUMN reports.keyword_suggestions IS
  'P18.B — LLM-suggested SEO keywords (gemini-2.5-flash with OpenAI fallback). Persisted via PATCH /api/report/[id]/enrich after /api/keyword-suggestions resolves.';
