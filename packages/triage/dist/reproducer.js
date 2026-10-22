"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlledReproducer = void 0;
class ControlledReproducer {
    executor;
    constructor(executor) {
        this.executor = executor;
    }
    /**
     * Re-runs a failed test case in clean, isolated browser contexts to confirm
     * reproducibility and isolate flaky tests.
     */
    async verifyReproducibility(browser, testCase, testRunId, attempts = 2) {
        const executions = [];
        let failureCount = 0;
        for (let i = 0; i < attempts; i++) {
            const context = await browser.newContext({
                viewport: { width: 1280, height: 800 },
                ignoreHTTPSErrors: true,
            });
            try {
                const page = await context.newPage();
                if (!this.executor) {
                    throw new Error('ControlledReproducer: No TestStepExecutor provided to executeTestCase');
                }
                const exec = await this.executor.executeTestCase(page, testCase, testRunId);
                executions.push(exec);
                if (exec.status === 'FAILED') {
                    failureCount++;
                }
            }
            finally {
                await context.close().catch(() => { });
            }
        }
        return {
            reproducible: failureCount === attempts,
            attemptCount: attempts,
            failureCount,
            executions,
        };
    }
}
exports.ControlledReproducer = ControlledReproducer;
//# sourceMappingURL=reproducer.js.map