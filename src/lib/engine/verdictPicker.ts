/**
 * Deterministic verdict-phrase picker.
 *
 * The same `seed` (typically the report ID, falling back to the URL)
 * always yields the same index — so a shared report renders the same
 * verdict copy across visitors and refreshes, while different sites
 * get visual variety.
 *
 * djb2 hash chosen for stability + tiny code; we don't need
 * cryptographic strength, just well-distributed bucketing modulo N.
 */

export function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return Math.abs(hash | 0);
}

export function pickVerdictIndex(seed: string, count: number): number {
  if (count <= 0) return 0;
  return djb2(seed || 'fallback') % count;
}
