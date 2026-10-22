import { Page } from 'playwright';
import { TestCase, TestExecution } from '@testpilot/core';
import { ArtifactVault } from '@testpilot/storage';
export interface FunctionalEngineOptions {
    vault?: ArtifactVault;
    screenshotOnFailure?: boolean;
}
export declare class FunctionalEngine {
    private vault;
    private screenshotOnFailure;
    constructor(options?: FunctionalEngineOptions);
    /**
     * Executes a single test case in a controlled browser page context,
     * tracking step outcomes, console logs, network failures, and taking failure screenshots.
     */
    executeTestCase(page: Page, testCase: TestCase, testRunId: string): Promise<TestExecution>;
}
//# sourceMappingURL=functional.d.ts.map