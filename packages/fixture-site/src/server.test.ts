import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import * as http from 'node:http';
import { createFixtureServer } from './server.js';

describe('Fixture Benchmark Site', () => {
  let server: http.Server;
  const PORT = 4099;
  const BASE = `http://localhost:${PORT}`;

  before((_, done) => {
    server = createFixtureServer();
    server.listen(PORT, done);
  });

  after((_, done) => {
    server.close(done);
  });

  it('serves 200 homepage with interactive counter element', async () => {
    const res = await fetch(`${BASE}/`);
    assert.strictEqual(res.status, 200);
    const body = await res.text();
    assert.strictEqual(body.includes('TestPilot Benchmark'), true);
    assert.strictEqual(body.includes('counter-btn'), true);
  });

  it('returns 404 for broken link target', async () => {
    const res = await fetch(`${BASE}/broken-target-404`);
    assert.strictEqual(res.status, 404);
  });

  it('serves accessibility page with expected WCAG failure landmarks', async () => {
    const res = await fetch(`${BASE}/accessibility`);
    const body = await res.text();
    assert.strictEqual(body.includes('a11y-img-no-alt'), true);
    assert.strictEqual(body.includes('empty-icon-btn'), true);
  });

  it('handles authentication failure and success', async () => {
    // 1. Bad credentials
    const badRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      body: 'email=bad@test.com&password=wrong',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    assert.strictEqual(badRes.status, 401);

    // 2. Good credentials
    const goodRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      body: 'email=admin%40testpilot.ai&password=pilotPass123!',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      redirect: 'manual',
    });
    assert.strictEqual(goodRes.status, 302);
    const cookie = goodRes.headers.get('set-cookie');
    assert.ok(cookie && cookie.includes('session_id='));
  });
});
