-- Phase 1: Stockage des recherches utilisateurs
-- Migration: 20260503000000_init.sql

CREATE TABLE reports (
  id                  VARCHAR(64) PRIMARY KEY,            -- slug "pixelab-ch-a8x4"
  url                 TEXT NOT NULL,
  lang                CHAR(2) NOT NULL CHECK (lang IN ('fr','en')),
  score               INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  crawl_ms            INTEGER NOT NULL,
  share_token         VARCHAR(32) UNIQUE,
  share_expires_at    TIMESTAMPTZ,
  data                JSONB NOT NULL,

  -- Métadonnées retargeting (Phase 1)
  ip_hash             CHAR(64),                           -- HMAC-SHA-256 hex
  country             CHAR(2),                            -- ISO code
  user_agent          TEXT,
  referrer            TEXT
);

CREATE INDEX reports_url_lang_created_idx
  ON reports(url, lang, created_at DESC);

CREATE INDEX reports_share_token_idx
  ON reports(share_token)
  WHERE share_token IS NOT NULL;

CREATE INDEX reports_created_at_idx
  ON reports(created_at);

CREATE INDEX reports_country_created_idx
  ON reports(country, created_at DESC)
  WHERE country IS NOT NULL;

-- RLS désactivée : tous les accès passent par service_role côté serveur.
-- (Pas de SQL nécessaire ici — RLS est OFF par défaut sur les tables nouvelles.)
