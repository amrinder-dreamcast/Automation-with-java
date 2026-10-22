import { Page } from 'playwright';
import { PerformanceMetrics } from '@testpilot/core';
export interface PerformanceBudget {
    maxNavigationMs?: number;
    maxFcpMs?: number;
    maxLcpMs?: number;
    maxTtfbMs?: number;
    maxClsScore?: number;
}
export interface PerformanceIssue {
    type: 'SLOW_NAVIGATION' | 'SLOW_FCP' | 'SLOW_LCP' | 'HIGH_TTFB' | 'HIGH_CLS' | 'SLOW_RESOURCE' | 'LARGE_PAGE';
    severity: 'P1' | 'P2' | 'P3' | 'P4';
    title: string;
    description: string;
    measured: number;
    threshold: number;
    unit: string;
}
export declare class PerformanceEngine {
    private budget;
    constructor(budget?: PerformanceBudget);
    /**
     * Measures Navigation Timing, Core Web Vitals (FCP, LCP, CLS), TTFB,
     * and resource waterfall for a target page.
     */
    measurePage(page: Page, targetUrl: string): Promise<PerformanceMetrics & {
        issues: PerformanceIssue[];
    }>;
}
//# sourceMappingURL=performance.d.ts.map