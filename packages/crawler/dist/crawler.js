"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeCrawler = void 0;
const playwright_1 = require("playwright");
const core_1 = require("@testpilot/core");
const storage_1 = require("@testpilot/storage");
const dom_extractor_js_1 = require("./dom-extractor.js");
class SafeCrawler {
    scope;
    vault;
    headless;
    onProgress;
    constructor(scope, options) {
        this.scope = scope;
        this.vault = options?.vault || new storage_1.ArtifactVault();
        this.headless = options?.headless ?? true;
        this.onProgress = options?.onProgress;
    }
    normalizeUrl(url) {
        try {
            const parsed = new URL(url);
            parsed.hash = ''; // ignore client-side hashes for canonical page identity
            // Remove trailing slash for consistency (unless root '/')
            if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
                parsed.pathname = parsed.pathname.slice(0, -1);
            }
            return parsed.href;
        }
        catch {
            return url;
        }
    }
    async crawl(sessionId) {
        const session = {
            id: sessionId,
            projectId: this.scope.projectId,
            targetUrl: this.scope.primaryUrl,
            status: 'RUNNING',
            startedAt: new Date().toISOString(),
            pages: [],
            brokenLinks: [],
            errors: [],
        };
        // 1. Initial SSRF Pre-flight on start URL
        const startValidation = await (0, core_1.validateTargetUrl)(this.scope.primaryUrl, this.scope);
        if (!startValidation.allowed) {
            session.status = 'FAILED';
            session.completedAt = new Date().toISOString();
            session.errors.push(`Target URL rejected by SSRF guard: ${startValidation.reason}`);
            return session;
        }
        let browser = null;
        let context = null;
        try {
            browser = await playwright_1.chromium.launch({
                headless: this.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            });
            context = await browser.newContext({
                viewport: { width: 1280, height: 800 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                ignoreHTTPSErrors: true,
                extraHTTPHeaders: {
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                },
            });
            const page = await context.newPage();
            // Route-level SSRF defense: intercept all outgoing HTTP requests and redirect hops
            await page.route('**/*', async (route) => {
                const reqUrl = route.request().url();
                const isNavigation = route.request().isNavigationRequest();
                // For navigation requests, strictly enforce scope
                if (isNavigation) {
                    const val = await (0, core_1.validateTargetUrl)(reqUrl, this.scope);
                    if (!val.allowed) {
                        session.errors.push(`Blocked navigation to prohibited destination '${reqUrl}': ${val.reason}`);
                        return route.abort('accessdenied');
                    }
                }
                return route.continue();
            });
            // BFS Crawl Queue
            const queue = [
                { url: this.normalizeUrl(this.scope.primaryUrl), depth: 0 },
            ];
            const visited = new Set();
            const visitedDomHashes = new Set();
            while (queue.length > 0 && session.pages.length < this.scope.maxPages) {
                const item = queue.shift();
                const canonical = this.normalizeUrl(item.url);
                if (visited.has(canonical)) {
                    continue;
                }
                visited.add(canonical);
                this.onProgress?.({
                    phase: 'NAVIGATING',
                    url: canonical,
                    depth: item.depth,
                    pagesCrawled: session.pages.length,
                    queueLength: queue.length,
                });
                const startTime = Date.now();
                let statusCode = 200;
                try {
                    const response = await page.goto(canonical, {
                        waitUntil: 'domcontentloaded',
                        timeout: this.scope.crawlTimeoutMs || 30000,
                    });
                    if (response) {
                        statusCode = response.status();
                    }
                    // Check for broken links (4xx, 5xx)
                    if (statusCode >= 400) {
                        session.brokenLinks.push({
                            sourceUrl: item.sourceUrl || this.scope.primaryUrl,
                            targetUrl: canonical,
                            statusCode,
                            error: `HTTP status ${statusCode}`,
                        });
                        this.onProgress?.({
                            phase: 'BROKEN_LINK_FOUND',
                            url: canonical,
                            depth: item.depth,
                            pagesCrawled: session.pages.length,
                            queueLength: queue.length,
                            message: `HTTP ${statusCode}`,
                        });
                        continue;
                    }
                    // Extract DOM elements & metadata
                    const extracted = await (0, dom_extractor_js_1.extractPageData)(page, canonical);
                    // Detect SPA loop or duplicate pages with different URL params
                    if (visitedDomHashes.has(extracted.domHash) && session.pages.length > 3) {
                        continue; // Skip duplicate DOM representation
                    }
                    visitedDomHashes.add(extracted.domHash);
                    // Capture page screenshot as artifact
                    let screenshotUrl;
                    try {
                        const buffer = await page.screenshot({ fullPage: false });
                        const shotFilename = `page-${session.pages.length + 1}-${encodeURIComponent(new URL(canonical).pathname.replace(/\//g, '_') || 'root')}`;
                        const saved = await this.vault.saveScreenshot(sessionId, shotFilename, buffer);
                        screenshotUrl = saved.relativeUrl;
                    }
                    catch {
                        // Ignore non-fatal screenshot failure
                    }
                    const discoveredPage = {
                        url: canonical,
                        title: extracted.title,
                        depth: item.depth,
                        statusCode,
                        loadTimeMs: Date.now() - startTime,
                        links: extracted.links,
                        interactiveElements: extracted.interactiveElements,
                        hasForms: extracted.hasForms,
                        hasAuthTriggers: extracted.hasAuthTriggers,
                        screenshotUrl,
                        domHash: extracted.domHash,
                    };
                    session.pages.push(discoveredPage);
                    this.onProgress?.({
                        phase: 'PAGE_DISCOVERED',
                        url: canonical,
                        depth: item.depth,
                        pagesCrawled: session.pages.length,
                        queueLength: queue.length,
                    });
                    // Enqueue child links if within max depth
                    if (item.depth < this.scope.maxCrawlDepth) {
                        for (const childUrl of extracted.links) {
                            const childCanonical = this.normalizeUrl(childUrl);
                            if (!visited.has(childCanonical)) {
                                // Pre-validate child URL against scope
                                const childVal = await (0, core_1.validateTargetUrl)(childCanonical, this.scope);
                                if (childVal.allowed) {
                                    queue.push({
                                        url: childCanonical,
                                        depth: item.depth + 1,
                                        sourceUrl: canonical,
                                    });
                                }
                            }
                        }
                    }
                }
                catch (pageErr) {
                    const errMessage = pageErr.message;
                    session.brokenLinks.push({
                        sourceUrl: item.sourceUrl || this.scope.primaryUrl,
                        targetUrl: canonical,
                        statusCode: 0,
                        error: errMessage,
                    });
                    session.errors.push(`Failed loading ${canonical}: ${errMessage}`);
                }
            }
            session.status = 'COMPLETED';
        }
        catch (fatalErr) {
            session.status = 'FAILED';
            session.errors.push(`Crawler fatal error: ${fatalErr.message}`);
        }
        finally {
            if (context)
                await context.close().catch(() => { });
            if (browser)
                await browser.close().catch(() => { });
            session.completedAt = new Date().toISOString();
        }
        return session;
    }
}
exports.SafeCrawler = SafeCrawler;
//# sourceMappingURL=crawler.js.map