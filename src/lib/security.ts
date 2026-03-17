import dns from 'dns';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve);

// DNS cache to avoid repeated resolutions for the same hostname
const dnsCache = new Map<string, { isPrivate: boolean; expiry: number }>();
const DNS_CACHE_TTL = 60_000; // 1 minute

/**
 * Checks whether a hostname resolves to a private/internal IP address.
 * Blocks RFC1918, loopback, link-local, AWS metadata, and .local/.internal hostnames.
 */
export async function isPrivateHost(hostname: string): Promise<boolean> {
  // Block known internal hostnames
  const lowerHost = hostname.toLowerCase();
  if (
    lowerHost === 'localhost' ||
    lowerHost.endsWith('.local') ||
    lowerHost.endsWith('.internal') ||
    lowerHost.endsWith('.localhost')
  ) {
    return true;
  }

  // Check cache
  const cached = dnsCache.get(lowerHost);
  if (cached && cached.expiry > Date.now()) {
    return cached.isPrivate;
  }

  let addresses: string[];
  try {
    addresses = await dnsResolve(hostname);
  } catch {
    // If DNS resolution fails, try treating it as an IP literal
    addresses = [hostname];
  }

  let isPrivate = false;
  for (const addr of addresses) {
    if (isPrivateIP(addr)) {
      isPrivate = true;
      break;
    }
  }

  dnsCache.set(lowerHost, { isPrivate, expiry: Date.now() + DNS_CACHE_TTL });
  return isPrivate;
}

function isPrivateIP(ip: string): boolean {
  // Loopback
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.')) return true;

  // RFC1918 private ranges
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  // Link-local
  if (ip.startsWith('169.254.')) return true;

  // AWS metadata endpoint
  if (ip === '169.254.169.254') return true;

  // IPv6 private/loopback
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;

  // Unspecified
  if (ip === '0.0.0.0' || ip === '::') return true;

  return false;
}

/**
 * Validates a URL for safe server-side fetching.
 * Blocks non-HTTP protocols and private/internal hosts (SSRF protection).
 */
export async function validateUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('URL invalide');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Protocole non supporté — seuls HTTP et HTTPS sont autorisés');
  }

  if (await isPrivateHost(parsed.hostname)) {
    throw new Error('Accès aux hôtes internes ou privés non autorisé');
  }
}

/**
 * In-memory IP-based rate limiter with sliding window.
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /**
   * Check whether the given IP is within rate limits.
   * Returns true if the request is allowed, false if rate-limited.
   */
  check(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.requests.get(ip) || [];
    // Remove expired entries
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= this.limit) {
      this.requests.set(ip, timestamps);
      return false;
    }

    timestamps.push(now);
    this.requests.set(ip, timestamps);
    return true;
  }
}

/** Rate limiter for /api/analyze — 5 requests per minute */
export const analyzeRateLimiter = new RateLimiter(5, 60_000);

/** Rate limiter for /api/image-proxy — 30 requests per minute */
export const proxyRateLimiter = new RateLimiter(30, 60_000);
