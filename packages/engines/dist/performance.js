"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceEngine = void 0;
const DEFAULT_BUDGET = {
    maxNavigationMs: 5000,
    maxFcpMs: 2500,
    maxLcpMs: 4000,
    maxTtfbMs: 1500,
    maxClsScore: 0.25,
};
class PerformanceEngine {
    budget;
    constructor(budget) {
        this.budget = { ...DEFAULT_BUDGET, ...budget };
    }
    /**
     * Measures Navigation Timing, Core Web Vitals (FCP, LCP, CLS), TTFB,
     * and resource waterfall for a target page.
     */
    async measurePage(page, targetUrl) {
        const requestTimes = new Map();
        const slowRequests = [];
        let totalRequests = 0;
        let failedRequests = 0;
        let totalBytesTransferred = 0;
        const onRequest = (req) => {
            totalRequests++;
            requestTimes.set(req.url(), Date.now());
        };
        const onResponse = (res) => {
            const start = requestTimes.get(res.url());
            if (start) {
                const duration = Date.now() - start;
                if (duration > 800) {
                    slowRequests.push({ url: res.url(), durationMs: duration });
                }
            }
            const len = res.headers()['content-length'];
            if (len)
                totalBytesTransferred += parseInt(len, 10) || 0;
            if (res.status() >= 400)
                failedRequests++;
        };
        const onRequestFailed = () => { failedRequests++; };
        page.on('request', onRequest);
        page.on('response', onResponse);
        page.on('requestfailed', onRequestFailed);
        try {
            await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });
            // Wait briefly for paint events to settle
            await page.waitForTimeout(1200);
            // Collect Navigation Timing + Core Web Vitals from browser
            const timingData = await page.evaluate(() => {
                const navEntries = performance.getEntriesByType('navigation');
                const paintEntries = performance.getEntriesByType('paint');
                const nav = navEntries[0];
                const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');
                // LCP via PerformanceObserver already gathered
                let lcpMs = 0;
                const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
                if (lcpEntries && lcpEntries.length > 0) {
                    lcpMs = Math.round(lcpEntries[lcpEntries.length - 1].startTime);
                }
                // CLS accumulation
                let clsScore = 0;
                const clsEntries = performance.getEntriesByType?.('layout-shift') || [];
                for (const entry of clsEntries) {
                    if (!entry.hadRecentInput)
                        clsScore += entry.value;
                }
                return {
                    navigationDurationMs: nav ? Math.round(nav.duration) : 0,
                    domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 0,
                    ttfbMs: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
                    fcpMs: fcpEntry ? Math.round(fcpEntry.startTime) : 0,
                    lcpMs,
                    clsScore: parseFloat(clsScore.toFixed(4)),
                };
            });
            // Analyse resource entries for waterfall breakdown
            const resourceData = await page.evaluate(() => {
                const entries = performance.getEntriesByType('resource');
                const byType = {};
                for (const entry of entries) {
                    const type = entry.initiatorType || 'other';
                    if (!byType[type])
                        byType[type] = { count: 0, totalBytes: 0, maxDurationMs: 0 };
                    byType[type].count++;
                    byType[type].totalBytes += entry.transferSize || 0;
                    byType[type].maxDurationMs = Math.max(byType[type].maxDurationMs, Math.round(entry.duration));
                }
                return { byType, totalResources: entries.length };
            });
            const metrics = {
                url: targetUrl,
                navigationDurationMs: timingData.navigationDurationMs,
                domContentLoadedMs: timingData.domContentLoadedMs,
                ttfbMs: timingData.ttfbMs,
                largestContentfulPaintMs: timingData.lcpMs || undefined,
                cumulativeLayoutShift: timingData.clsScore || undefined,
                totalRequests: resourceData.totalResources || totalRequests,
                failedRequests,
                totalBytesTransferred,
                slowRequests: slowRequests.sort((a, b) => b.durationMs - a.durationMs).slice(0, 5),
                issues: [],
            };
            // Attach FCP as custom property
            metrics.firstContentfulPaintMs = timingData.fcpMs;
            metrics.resourceBreakdown = resourceData.byType;
            // --- Threshold evaluation ---
            const issues = [];
            if (timingData.navigationDurationMs > this.budget.maxNavigationMs) {
                issues.push({
                    type: 'SLOW_NAVIGATION',
                    severity: timingData.navigationDurationMs > this.budget.maxNavigationMs * 2 ? 'P1' : 'P2',
                    title: `Slow Page Load: ${timingData.navigationDurationMs}ms`,
                    description: `Total navigation time exceeds acceptable threshold. A page load over ${this.budget.maxNavigationMs}ms leads to high bounce rates and poor UX.`,
                    measured: timingData.navigationDurationMs,
                    threshold: this.budget.maxNavigationMs,
                    unit: 'ms',
                });
            }
            if (timingData.fcpMs > 0 && timingData.fcpMs > this.budget.maxFcpMs) {
                issues.push({
                    type: 'SLOW_FCP',
                    severity: timingData.fcpMs > this.budget.maxFcpMs * 1.5 ? 'P2' : 'P3',
                    title: `Slow First Contentful Paint: ${timingData.fcpMs}ms`,
                    description: 'FCP is the time until the browser first renders text or image content. Slow FCP means users see a blank page longer, increasing perceived load time.',
                    measured: timingData.fcpMs,
                    threshold: this.budget.maxFcpMs,
                    unit: 'ms',
                });
            }
            if (timingData.lcpMs > 0 && timingData.lcpMs > this.budget.maxLcpMs) {
                issues.push({
                    type: 'SLOW_LCP',
                    severity: timingData.lcpMs > this.budget.maxLcpMs * 1.5 ? 'P1' : 'P2',
                    title: `Poor Largest Contentful Paint: ${timingData.lcpMs}ms`,
                    description: 'LCP measures when the largest visible content element renders. Google uses LCP as a Core Web Vital. Exceeding 4s is rated "Poor".',
                    measured: timingData.lcpMs,
                    threshold: this.budget.maxLcpMs,
                    unit: 'ms',
                });
            }
            if (timingData.ttfbMs > this.budget.maxTtfbMs) {
                issues.push({
                    type: 'HIGH_TTFB',
                    severity: timingData.ttfbMs > this.budget.maxTtfbMs * 2 ? 'P2' : 'P3',
                    title: `High Time to First Byte: ${timingData.ttfbMs}ms`,
                    description: 'TTFB measures server-side processing and network latency. High TTFB may indicate slow server-side rendering, unoptimized database queries, or lack of CDN.',
                    measured: timingData.ttfbMs,
                    threshold: this.budget.maxTtfbMs,
                    unit: 'ms',
                });
            }
            if (timingData.clsScore > this.budget.maxClsScore) {
                issues.push({
                    type: 'HIGH_CLS',
                    severity: timingData.clsScore > 0.5 ? 'P1' : 'P2',
                    title: `High Cumulative Layout Shift: ${timingData.clsScore.toFixed(3)}`,
                    description: 'CLS measures unexpected visual layout shifts. A high CLS score indicates content moving around during page load, causing accidental clicks and poor UX.',
                    measured: timingData.clsScore,
                    threshold: this.budget.maxClsScore,
                    unit: 'score',
                });
            }
            const topSlowReq = slowRequests[0];
            if (topSlowReq && topSlowReq.durationMs > 2000) {
                issues.push({
                    type: 'SLOW_RESOURCE',
                    severity: 'P3',
                    title: `Slow Sub-Resource: ${topSlowReq.durationMs}ms`,
                    description: `A resource request took ${topSlowReq.durationMs}ms. Slow sub-resources block rendering and delay interactivity.`,
                    measured: topSlowReq.durationMs,
                    threshold: 2000,
                    unit: 'ms',
                });
            }
            if (totalBytesTransferred > 2_000_000) {
                issues.push({
                    type: 'LARGE_PAGE',
                    severity: 'P3',
                    title: `Large Total Page Weight: ${(totalBytesTransferred / 1024 / 1024).toFixed(1)}MB`,
                    description: 'Total transferred bytes exceed 2MB. Large pages lead to slower loads on mobile networks and higher data usage for users.',
                    measured: totalBytesTransferred,
                    threshold: 2_000_000,
                    unit: 'bytes',
                });
            }
            metrics.issues = issues;
            return metrics;
        }
        finally {
            page.off('request', onRequest);
            page.off('response', onResponse);
            page.off('requestfailed', onRequestFailed);
        }
    }
}
exports.PerformanceEngine = PerformanceEngine;
//# sourceMappingURL=performance.js.map