-- Phase 2: Persistance asynchrone de l'enrichissement geo + CWV
-- Migration: 20260509000000_add_enrichment_columns.sql
--
-- Avant cette migration, geoAnalysis et coreWebVitals n'existaient que dans
-- le state React éphémère du frontend (page.tsx fetche /api/geo-analyze et
-- /api/analyze/cwv après l'analyse initiale). Conséquence : à la réouverture
-- d'un rapport via /r/<id> ou au partage via /s/<slug>, ces données étaient
-- perdues. Ces deux colonnes accueillent les payloads bruts retournés par
-- ces endpoints, populés via PATCH /api/report/[id]/enrich.

ALTER TABLE reports
  ADD COLUMN geo_analysis JSONB,
  ADD COLUMN cwv          JSONB;

-- Pas d'index : ces colonnes ne sont jamais filtrées ni triées,
-- juste lues lors d'un GET par id.
