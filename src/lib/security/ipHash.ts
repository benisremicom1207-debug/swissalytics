/**
 * IP hashing — HMAC-SHA-256 with a server-side salt.
 *
 * The salt MUST be stable across deploys (else retargeting cohorts break)
 * and MUST be secret (else a rainbow table reverses the hash for known IPs).
 * Set IP_HASH_SALT at deploy time. Use a different salt per environment.
 */

import { createHmac } from 'crypto';

function getSalt(): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt || salt.length < 16) {
    throw new Error(
      'IP_HASH_SALT not configured (must be ≥16 chars). Set it in env vars.',
    );
  }
  return salt;
}

export function hashIp(ip: string): string {
  return createHmac('sha256', getSalt()).update(ip).digest('hex');
}
