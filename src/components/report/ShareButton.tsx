'use client';

import { useState } from 'react';

/**
 * Share button shown in the MetricStrip caption bar. Calls
 * `POST /api/report/<id>/share` to enable a 30-day share link, then copies
 * the resulting URL (relative path returned by the API + window.origin)
 * to the clipboard.
 *
 * Silent on failure today — Phase 7 should add a user-facing error state.
 */
export function ShareButton({ reportId, isFr }: { reportId: string; isFr: boolean }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);

  async function onShare() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/report/${reportId}/share`, { method: 'POST' });
      if (!res.ok) throw new Error('share failed');
      const data = (await res.json()) as { shareUrl?: string };
      const shareUrl = data.shareUrl ?? '';
      const full = `${window.location.origin}${shareUrl}`;
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    } finally {
      setBusy(false);
    }
  }

  const baseLabel = isFr ? 'Partager' : 'Share';
  const okLabel = isFr ? 'Copié ✓' : 'Copied ✓';

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={busy}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="mono"
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '8px 14px',
        border: '2px solid var(--sa-ink)',
        background: hover ? 'var(--sa-ink)' : 'var(--sa-cream)',
        color: hover ? 'var(--sa-cream)' : 'var(--sa-ink)',
        cursor: busy ? 'wait' : 'pointer',
        transition: 'background 120ms ease, color 120ms ease',
      }}
    >
      {copied ? okLabel : baseLabel}
    </button>
  );
}
