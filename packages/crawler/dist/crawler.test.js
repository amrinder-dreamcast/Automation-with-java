"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs/promises"));
const fixture_site_1 = require("@testpilot/fixture-site");
const storage_1 = require("@testpilot/storage");
const crawler_js_1 = require("./crawler.js");
(0, node_test_1.describe)('SafeCrawler Integration with Benchmark Fixture', () => {
    let server;
    const PORT = 4055;
    const BASE_URL = `http://localhost:${PORT}`;
    let tempStorageDir;
    (0, node_test_1.before)((_, done) => {
        tempStorageDir = path.join(os.tmpdir(), `testpilot-crawler-${Date.now()}`);
        server = (0, fixture_site_1.createFixtureServer)();
        server.listen(PORT, done);
    });
    (0, node_test_1.after)(async () => {
        server.close();
        await fs.rm(tempStorageDir, { recursive: true, force: true }).catch(() => { });
    });
    (0, node_test_1.it)('crawls the fixture site, discovers pages, detects broken links and captures interactive elements', async () => {
        const scope = {
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
        const vault = new storage_1.ArtifactVault(tempStorageDir);
        const events = [];
        const crawler = new crawler_js_1.SafeCrawler(scope, {
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
//# sourceMappingURL=crawler.test.js.map