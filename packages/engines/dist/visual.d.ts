import { Page } from 'playwright';
import { VisualDiffResult } from '@testpilot/core';
import { ArtifactVault } from '@testpilot/storage';
export interface VisualEngineOptions {
    vault?: ArtifactVault;
    threshold?: number;
    mismatchTolerancePercent?: number;
    viewportWidth?: number;
    viewportHeight?: number;
}
export interface VisualTestResult extends VisualDiffResult {
    pageName: string;
    pageUrl: string;
    capturedAt: string;
    isBaseline: boolean;
    diffSummary?: string;
}
export declare class VisualRegressionEngine {
    private vault;
    private threshold;
    private mismatchTolerancePercent;
    private viewportWidth;
    private viewportHeight;
    constructor(options?: VisualEngineOptions);
    /**
     * Captures a full-page screenshot of the given page and saves it as a baseline
     * or compares it against a previously saved baseline.
     */
    captureAndCompare(page: Page, pageUrl: string, testRunId: string, pageName: string): Promise<VisualTestResult>;
    /**
     * Compares two PNG image buffers, produces a diff image highlighting divergences,
     * and calculates the mismatch percentage against configured thresholds.
     */
    compareScreenshots(baselineBuffer: Buffer, candidateBuffer: Buffer, testRunId: string, diffName: string): Promise<VisualDiffResult>;
    /**
     * Resets the baseline for a specific page (next run will create a new baseline).
     */
    resetBaseline(pageName: string): Promise<void>;
}
//# sourceMappingURL=visual.d.ts.map