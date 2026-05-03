/**
 * SupabaseReportsRepository — Postgres-backed implementation.
 *
 * Speaks to the `reports` table via the Supabase JS client. All reads/writes
 * use the service_role key (bypasses RLS). On any DB error, methods throw —
 * callers (e.g. /api/analyze) decide how to handle (fail-open or fail-hard).
 *
 * Timestamps in the DB are TIMESTAMPTZ (ISO strings); StoredReport uses
 * unix milliseconds. Conversion happens at the boundary — see rowToStored
 * and storedToRow below.
 */

import type { ReportsRepository } from './repository';
import type { Lang, ReportSummary, StoredReport } from './types';
import { getSupabaseClient } from './supabaseClient';

interface ReportRow {
  id: string;
  url: string;
  lang: Lang;
  score: number;
  created_at: string;
  crawl_ms: number;
  share_token: string | null;
  share_expires_at: string | null;
  data: any;
  ip_hash: string | null;
  country: string | null;
  user_agent: string | null;
  referrer: string | null;
}

export function storedToRow(r: StoredReport): ReportRow {
  return {
    id: r.id,
    url: r.url,
    lang: r.lang,
    score: r.score,
    created_at: new Date(r.createdAt).toISOString(),
    crawl_ms: r.crawlMs,
    share_token: r.shareToken,
    share_expires_at: r.shareExpiresAt
      ? new Date(r.shareExpiresAt).toISOString()
      : null,
    data: r.data,
    ip_hash: r.ipHash ?? null,
    country: r.country ?? null,
    user_agent: r.userAgent ?? null,
    referrer: r.referrer ?? null,
  };
}

export function rowToStored(row: ReportRow): StoredReport {
  return {
    id: row.id,
    url: row.url,
    lang: row.lang,
    score: row.score,
    createdAt: new Date(row.created_at).getTime(),
    crawlMs: row.crawl_ms,
    shareToken: row.share_token,
    shareExpiresAt: row.share_expires_at
      ? new Date(row.share_expires_at).getTime()
      : null,
    data: row.data,
    ipHash: row.ip_hash,
    country: row.country,
    userAgent: row.user_agent,
    referrer: row.referrer,
  };
}

export class SupabaseReportsRepository implements ReportsRepository {
  private get client() {
    return getSupabaseClient();
  }

  async save(report: StoredReport): Promise<void> {
    const { error } = await this.client
      .from('reports')
      .insert(storedToRow(report));
    if (error) throw new Error(`supabase save: ${error.message}`);
  }

  async getById(id: string): Promise<StoredReport | null> {
    const { data, error } = await this.client
      .from('reports')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`supabase getById: ${error.message}`);
    return data ? rowToStored(data as ReportRow) : null;
  }

  async getByShareToken(token: string): Promise<StoredReport | null> {
    const { data, error } = await this.client
      .from('reports')
      .select('*')
      .eq('share_token', token)
      .maybeSingle();
    if (error) throw new Error(`supabase getByShareToken: ${error.message}`);
    if (!data) return null;
    const stored = rowToStored(data as ReportRow);
    if (stored.shareExpiresAt && stored.shareExpiresAt < Date.now()) {
      return null;
    }
    return stored;
  }

  async setShareToken(
    id: string,
    token: string,
    expiresAt: number,
  ): Promise<StoredReport | null> {
    const { data, error } = await this.client
      .from('reports')
      .update({
        share_token: token,
        share_expires_at: new Date(expiresAt).toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new Error(`supabase setShareToken: ${error.message}`);
    return data ? rowToStored(data as ReportRow) : null;
  }

  async clearShareToken(id: string): Promise<StoredReport | null> {
    const { data, error } = await this.client
      .from('reports')
      .update({ share_token: null, share_expires_at: null })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new Error(`supabase clearShareToken: ${error.message}`);
    return data ? rowToStored(data as ReportRow) : null;
  }

  async findRecent(
    url: string,
    lang: Lang,
    maxAgeMs: number,
  ): Promise<StoredReport | null> {
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    const { data, error } = await this.client
      .from('reports')
      .select('*')
      .eq('url', url)
      .eq('lang', lang)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`supabase findRecent: ${error.message}`);
    return data ? rowToStored(data as ReportRow) : null;
  }

  async purge(olderThanMs: number): Promise<number> {
    // Single Date.now() snapshot — keeps both statements consistent against
    // the same "now" even though Supabase JS can't run them in one transaction.
    const now = Date.now();
    const cutoff = new Date(now - olderThanMs).toISOString();
    const nowIso = new Date(now).toISOString();

    const { count, error } = await this.client
      .from('reports')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff);
    if (error) throw new Error(`supabase purge delete: ${error.message}`);

    const { error: clearError } = await this.client
      .from('reports')
      .update({ share_token: null, share_expires_at: null })
      .lt('share_expires_at', nowIso);
    if (clearError) {
      throw new Error(`supabase purge clear-tokens: ${clearError.message}`);
    }

    return count ?? 0;
  }

  async listRecent(limit: number): Promise<ReportSummary[]> {
    const { data, error } = await this.client
      .from('reports')
      .select('id,url,lang,score,created_at,share_token,share_expires_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`supabase listRecent: ${error.message}`);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      url: r.url,
      lang: r.lang,
      score: r.score,
      createdAt: new Date(r.created_at).getTime(),
      shareToken: r.share_token,
      shareExpiresAt: r.share_expires_at
        ? new Date(r.share_expires_at).getTime()
        : null,
    }));
  }
}
