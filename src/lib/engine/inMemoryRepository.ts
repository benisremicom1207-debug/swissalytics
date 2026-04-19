/**
 * InMemoryReportsRepository — default implementation.
 *
 * Reports live only in process memory. Reboot = data lost.
 * Good enough for MVP and dev. Swap for SQLite/Postgres in production
 * by implementing the same ReportsRepository interface.
 */

import type { Lang, ReportSummary, StoredReport } from './types';
import type { ReportsRepository } from './repository';

export class InMemoryReportsRepository implements ReportsRepository {
  private byId = new Map<string, StoredReport>();
  private byToken = new Map<string, string>(); // token -> id

  async save(report: StoredReport): Promise<void> {
    if (this.byId.has(report.id)) {
      throw new Error(`Report id collision: ${report.id}`);
    }
    this.byId.set(report.id, report);
    if (report.shareToken) this.byToken.set(report.shareToken, report.id);
  }

  async getById(id: string): Promise<StoredReport | null> {
    return this.byId.get(id) ?? null;
  }

  async getByShareToken(token: string): Promise<StoredReport | null> {
    const id = this.byToken.get(token);
    if (!id) return null;
    const r = this.byId.get(id);
    if (!r) return null;
    if (r.shareExpiresAt && r.shareExpiresAt < Date.now()) return null;
    return r;
  }

  async setShareToken(
    id: string,
    token: string,
    expiresAt: number,
  ): Promise<StoredReport | null> {
    const r = this.byId.get(id);
    if (!r) return null;
    // revoke old token if any
    if (r.shareToken) this.byToken.delete(r.shareToken);
    r.shareToken = token;
    r.shareExpiresAt = expiresAt;
    r.data = { ...r.data, shareToken: token, shareExpiresAt: new Date(expiresAt).toISOString() };
    this.byToken.set(token, id);
    return r;
  }

  async clearShareToken(id: string): Promise<StoredReport | null> {
    const r = this.byId.get(id);
    if (!r) return null;
    if (r.shareToken) this.byToken.delete(r.shareToken);
    r.shareToken = null;
    r.shareExpiresAt = null;
    const { shareToken: _t, shareExpiresAt: _e, ...rest } = r.data;
    r.data = rest as typeof r.data;
    return r;
  }

  async findRecent(
    url: string,
    lang: Lang,
    maxAgeMs: number,
  ): Promise<StoredReport | null> {
    const cutoff = Date.now() - maxAgeMs;
    let best: StoredReport | null = null;
    for (const r of this.byId.values()) {
      if (r.url !== url || r.lang !== lang) continue;
      if (r.createdAt < cutoff) continue;
      if (!best || r.createdAt > best.createdAt) best = r;
    }
    return best;
  }

  async purge(olderThanMs: number): Promise<number> {
    const cutoff = Date.now() - olderThanMs;
    const now = Date.now();
    let n = 0;
    for (const [id, r] of this.byId) {
      const expired = r.createdAt < cutoff;
      const shareExpired = r.shareExpiresAt !== null && r.shareExpiresAt < now;
      if (expired) {
        if (r.shareToken) this.byToken.delete(r.shareToken);
        this.byId.delete(id);
        n++;
      } else if (shareExpired && r.shareToken) {
        // keep report but revoke token
        this.byToken.delete(r.shareToken);
        r.shareToken = null;
        r.shareExpiresAt = null;
      }
    }
    return n;
  }

  async listRecent(limit: number): Promise<ReportSummary[]> {
    const all = [...this.byId.values()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
    return all.map((r) => ({
      id: r.id,
      url: r.url,
      lang: r.lang,
      score: r.score,
      createdAt: r.createdAt,
      shareToken: r.shareToken,
      shareExpiresAt: r.shareExpiresAt,
    }));
  }
}
