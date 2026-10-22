import { Browser, Page } from 'playwright';
import { TestCase, TestExecution } from '@testpilot/core';
export interface TestStepExecutor {
    executeTestCase(page: Page, testCase: TestCase, testRunId: string): Promise<TestExecution>;
}
export interface ReproductionOutcome {
    reproducible: boolean;
    attemptCount: number;
    failureCount: number;
    executions: TestExecution[];
}
export declare class ControlledReproducer {
    private executor?;
    constructor(executor?: TestStepExecutor);
    /**
     * Re-runs a failed test case in clean, isolated browser contexts to confirm
     * reproducibility and isolate flaky tests.
     */
    verifyReproducibility(browser: Browser, testCase: TestCase, testRunId: string, attempts?: number): Promise<ReproductionOutcome>;
}
//# sourceMappingURL=reproducer.d.ts.map