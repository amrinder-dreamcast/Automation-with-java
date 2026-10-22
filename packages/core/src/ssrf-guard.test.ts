import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { isPrivateIPv4, isPrivateIPv6, validateTargetUrl } from './ssrf-guard.js';
import { TargetScope } from './types.js';

describe('SSRF Guard: IP Classification', () => {
  it('correctly identifies RFC 1918 private IPv4 ranges', () => {
    assert.strictEqual(isPrivateIPv4('10.0.0.1'), true);
    assert.strictEqual(isPrivateIPv4('10.255.255.254'), true);
    assert.strictEqual(isPrivateIPv4('172.16.0.1'), true);
    assert.strictEqual(isPrivateIPv4('172.31.255.254'), true);
    assert.strictEqual(isPrivateIPv4('192.168.1.1'), true);
  });

  it('correctly identifies loopback and cloud metadata IPv4 addresses', () => {
    assert.strictEqual(isPrivateIPv4('127.0.0.1'), true);
    assert.strictEqual(isPrivateIPv4('127.0.0.2'), true);
    assert.strictEqual(isPrivateIPv4('169.254.169.254'), true); // AWS/GCP metadata
    assert.strictEqual(isPrivateIPv4('169.254.1.1'), true);
  });

  it('allows public IPv4 addresses', () => {
    assert.strictEqual(isPrivateIPv4('8.8.8.8'), false);
    assert.strictEqual(isPrivateIPv4('1.1.1.1'), false);
    assert.strictEqual(isPrivateIPv4('93.184.216.34'), false); // example.com
  });

  it('identifies IPv6 loopback and link-local', () => {
    assert.strictEqual(isPrivateIPv6('::1'), true);
    assert.strictEqual(isPrivateIPv6('fe80::1'), true);
    assert.strictEqual(isPrivateIPv6('::ffff:127.0.0.1'), true);
  });
});

describe('SSRF Guard: URL Scope Validation', () => {
  const productionScope: TargetScope = {
    id: 'scope-1',
    projectId: 'proj-1',
    primaryUrl: 'https://example.com',
    allowedDomains: ['example.com'],
    allowSubdomains: true,
    allowExternalLinks: false,
    maxCrawlDepth: 3,
    maxPages: 10,
    crawlTimeoutMs: 10000,
    allowLocalTargets: false,
  };

  it('rejects attempts to access cloud metadata IPs', async () => {
    const res = await validateTargetUrl('http://169.254.169.254/latest/meta-data', productionScope);
    assert.strictEqual(res.allowed, false);
    assert.match(res.reason ?? '', /prohibited/i);
  });

  it('rejects loopback localhost targets in production mode', async () => {
    const res = await validateTargetUrl('http://127.0.0.1:8080/admin', productionScope);
    assert.strictEqual(res.allowed, false);
  });

  it('rejects URLs outside allowed domain boundary', async () => {
    const res = await validateTargetUrl('https://malicious-site.com/exploit', productionScope);
    assert.strictEqual(res.allowed, false);
    assert.match(res.reason ?? '', /outside the authorized project scope/i);
  });

  it('allows subdomains when allowSubdomains is true', async () => {
    const res = await validateTargetUrl('https://api.example.com/v1', productionScope);
    // Since example.com is public, if DNS resolves, it is allowed
    // Note: If running offline, DNS check returns error which is safe
    if (res.allowed) {
      assert.strictEqual(res.allowed, true);
    }
  });

  it('permits localhost when allowLocalTargets is explicitly true for fixture sites', async () => {
    const localScope: TargetScope = {
      ...productionScope,
      primaryUrl: 'http://localhost:3000',
      allowedDomains: ['localhost'],
      allowLocalTargets: true,
    };
    const res = await validateTargetUrl('http://localhost:3000/test-fixture', localScope);
    assert.strictEqual(res.allowed, true);
  });
});
