/**
 * SSRF guard — validate URLs before crawling.
 *
 * Blocks:
 * - Non-http(s) protocols
 * - Loopback, link-local, and RFC1918 private IPs
 * - localhost, 0.0.0.0
 * - AWS/Azure/GCP metadata endpoints (169.254.*)
 *
 * Note: we resolve DNS and check the resolved address, not just the hostname.
 * Otherwise a public domain could point to 127.0.0.1 and bypass the check.
 */

import { promises as dns } from 'node:dns';
import net from 'node:net';

export class SsrfError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'invalid-url'
      | 'bad-protocol'
      | 'private-ip'
      | 'dns-fail'
      | 'blocked-host',
  ) {
    super(message);
    this.name = 'SsrfError';
  }
}

/** IPv4 private/reserved ranges (CIDR-lite). */
const V4_PRIVATE = [
  ['10.0.0.0', 8],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['0.0.0.0', 8],
  ['100.64.0.0', 10], // CGNAT
  ['198.18.0.0', 15], // benchmark
  ['224.0.0.0', 4],   // multicast
  ['240.0.0.0', 4],   // reserved
] as const;

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return -1;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inCidr(ip: string, base: string, bits: number): boolean {
  const ipN = ipv4ToInt(ip);
  const baseN = ipv4ToInt(base);
  if (ipN < 0 || baseN < 0) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipN & mask) === (baseN & mask);
}

function isPrivateV4(ip: string): boolean {
  return V4_PRIVATE.some(([base, bits]) => inCidr(ip, base as string, bits as number));
}

function isPrivateV6(ip: string): boolean {
  const lc = ip.toLowerCase();
  if (lc === '::1' || lc === '::' || lc === '0:0:0:0:0:0:0:1' || lc === '0:0:0:0:0:0:0:0') return true;
  // fc00::/7 unique local
  if (lc.startsWith('fc') || lc.startsWith('fd')) return true;
  // fe80::/10 link local
  if (lc.startsWith('fe8') || lc.startsWith('fe9') || lc.startsWith('fea') || lc.startsWith('feb')) return true;
  // IPv4-mapped (::ffff:a.b.c.d)
  if (lc.startsWith('::ffff:')) {
    const v4 = lc.slice(7);
    if (net.isIPv4(v4)) return isPrivateV4(v4);
  }
  return false;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateV4(ip);
  if (net.isIPv6(ip)) return isPrivateV6(ip);
  return true; // unknown format — block
}

const BLOCKED_HOSTS = new Set([
  'localhost',
  'ip6-localhost',
  'ip6-loopback',
  'broadcasthost',
]);

export interface SsrfValidatedUrl {
  url: URL;
  hostname: string;
  resolvedIp: string;
}

/**
 * Validate a user-supplied URL for safe crawling.
 * Throws SsrfError on rejection.
 */
export async function assertSafeUrl(input: string): Promise<SsrfValidatedUrl> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new SsrfError('URL invalide', 'invalid-url');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SsrfError('Protocole non supporté', 'bad-protocol');
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(hostname)) {
    throw new SsrfError('Hôte bloqué', 'blocked-host');
  }

  // If hostname is already a literal IP, check it directly
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new SsrfError('IP privée ou réservée', 'private-ip');
    }
    return { url, hostname, resolvedIp: hostname };
  }

  // Resolve and check every A/AAAA answer
  const ips: string[] = [];
  try {
    const [v4, v6] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolve6(hostname),
    ]);
    if (v4.status === 'fulfilled') ips.push(...v4.value);
    if (v6.status === 'fulfilled') ips.push(...v6.value);
  } catch {
    // fall through
  }

  if (ips.length === 0) {
    throw new SsrfError('Impossible de résoudre le domaine', 'dns-fail');
  }

  for (const ip of ips) {
    if (isPrivateIp(ip)) {
      throw new SsrfError('Domaine résout vers une IP privée', 'private-ip');
    }
  }

  return { url, hostname, resolvedIp: ips[0] };
}
