import { describe, it, expect, beforeEach } from 'vitest';
import { hashIp } from '../ipHash';

describe('hashIp', () => {
  beforeEach(() => {
    process.env.IP_HASH_SALT = 'test-salt-32-chars-deadbeefcafe00';
  });

  it('returns deterministic 64-char hex for same IP', () => {
    const a = hashIp('192.0.2.1');
    const b = hashIp('192.0.2.1');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns different hash for different IPs', () => {
    expect(hashIp('192.0.2.1')).not.toBe(hashIp('192.0.2.2'));
  });

  it('returns different hash with different salt (env read fresh each call)', () => {
    process.env.IP_HASH_SALT = 'first-salt-XXXXXXXXXXXXXXXXXXXXX';
    const a = hashIp('192.0.2.1');
    process.env.IP_HASH_SALT = 'second-salt-YYYYYYYYYYYYYYYYYYYY';
    const b = hashIp('192.0.2.1');
    expect(a).not.toBe(b);
  });

  it('throws when IP_HASH_SALT is missing', () => {
    delete process.env.IP_HASH_SALT;
    expect(() => hashIp('192.0.2.1')).toThrow(/IP_HASH_SALT/);
  });

  it('throws when IP_HASH_SALT is too short (<16 chars)', () => {
    process.env.IP_HASH_SALT = 'short';
    expect(() => hashIp('192.0.2.1')).toThrow(/IP_HASH_SALT/);
  });
});
