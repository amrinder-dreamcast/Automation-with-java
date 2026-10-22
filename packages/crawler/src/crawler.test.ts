import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import * as http from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { createFixtureServer } from '@testpilot/fixture-site';
import { TargetScope } from '@testpilot/core';
import { ArtifactVault } from '@testpilot/storage';
import { SafeCrawler } from './crawler.js';

describe('SafeCrawler Integration with Benchmark Fixture', () => {
  let server: http.Server;
  const PORT = 4055;
  const BASE_URL = `http://localhost:${PORT}`;
  let tempStorageDir: string;

  before((_, done) => {
    tempStorageDir = path.join(os.tmpdir(), `testpilot-crawler-${Date.now()}`);
    server = createFixtureServer();
    server.listen(PORT, done);
  });

  after(async () => {
    server.close();
    await fs.rm(tempStorageDir, { recursive: true, force: true }).catch(() => {});
  });

  it('crawls the fixture site, discovers pages, detects broken links and captures interactive elements', async () => {
    const scope: TargetScope = {
      id: 'scope-fixture',
      projectId: 'proj-fixture',
      primaryUrl: `${BASE_URL}/`,
      allowedDomains: ['localhost'],
      allowSubdomains: false,
      allowExternalLinks: false,
      maxCrawlDepth: 2,
      maxPages: 10,
      crawlTimeoutMs: 15000,
      allowLocalTargets: true,
    };

    const vault = new ArtifactVault(tempStorageDir);
    const events: string[] = [];
    const crawler = new SafeCrawler(scope, {
      vault,
      headless: true,
      onProgress: (evt) => events.push(`${evt.phase}:${evt.url}`),
    });

    const session = await crawler.crawl('session-test-1');

    assert.strictEqual(session.status, 'COMPLETED');
    assert.ok(session.pages.length >= 4, `Expected at least 4 pages, got ${session.pages.length}`);

    // Verify home page was crawled and contains the counter button
    const homePage = session.pages.find((p) => p.url === `${BASE_URL}/` || p.url === `${BASE_URL}`);
    assert.ok(homePage, 'Home page should be discovered');
    assert.ok(homePage.interactiveElements.some((el) => el.id.includes('elem-') || el.name?.includes('Increment')));

    // Verify screenshot was captured and persisted
    assert.ok(homePage.screenshotUrl, 'Home page should have a screenshotUrl');

    // Verify broken link was detected
    const has404 = session.brokenLinks.some((b) => b.targetUrl.includes('broken-target-404') || b.statusCode === 404);
    assert.ok(has404, 'Broken target 404 should be registered in brokenLinks');
  });
});
