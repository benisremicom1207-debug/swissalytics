import { describe, it, expect, beforeEach } from 'vitest';

describe('hashIp', () => {
  beforeEach(() => {
    process.env.IP_HASH_SALT = 'test-salt-32-chars-deadbeefcafe00';
  });

  it('returns deterministic 64-char hex for same IP', async () => {
    const { hashIp } = await import('../ipHash');
    const a = hashIp('192.0.2.1');
    const b = hashIp('192.0.2.1');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns different hash for different IPs', async () => {
    const { hashIp } = await import('../ipHash');
    expect(hashIp('192.0.2.1')).not.toBe(hashIp('192.0.2.2'));
  });

  it('returns different hash with different salt', async () => {
    process.env.IP_HASH_SALT = 'first-salt-XXXXXXXXXXXXXXXXXXXXX';
    const mod1 = await import('../ipHash?v=1');
    const a = mod1.hashIp('192.0.2.1');

    process.env.IP_HASH_SALT = 'second-salt-YYYYYYYYYYYYYYYYYYYY';
    const mod2 = await import('../ipHash?v=2');
    const b = mod2.hashIp('192.0.2.1');

    expect(a).not.toBe(b);
  });
});
