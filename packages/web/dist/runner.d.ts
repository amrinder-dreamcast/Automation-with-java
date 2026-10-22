import { Project, TargetScope, TestRun } from '@testpilot/core';
import { TestPilotDatabase, ArtifactVault } from '@testpilot/storage';
export interface RunProgressEvent {
    runId: string;
    stage: 'INITIALIZING' | 'CRAWLING' | 'AUDITING' | 'EXPLORING' | 'TRIAGING' | 'COMPLETED' | 'FAILED';
    message: string;
    progressPercent: number;
    data?: any;
}
export declare class TestPilotRunner {
    private db;
    private vault;
    private listeners;
    constructor(db?: TestPilotDatabase, vault?: ArtifactVault);
    subscribe(runId: string, listener: (event: RunProgressEvent) => void): () => void;
    private emit;
    /**
     * Orchestrates the complete automated testing cycle:
     * 1. Scope & SSRF Validation
     * 2. Page & Element Discovery Crawl
     * 3. Accessibility (WCAG 2.1/2.2) Audits
     * 4. Passive Security Header & Cookie Scan
     * 5. Performance Diagnostics (FCP, LCP, CLS, TTFB, Navigation)
     * 6. Visual Regression Screenshots (Pixelmatch)
     * 7. AI Exploratory Functional Journeys
     * 8. Defect Triaging & Controlled Reproducibility Verification
     */
    executeTestCycle(project: Project, scopeOverride?: Partial<TargetScope>, customRunId?: string): Promise<TestRun>;
}
//# sourceMappingURL=runner.d.ts.map