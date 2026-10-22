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

export class ControlledReproducer {
  private executor?: TestStepExecutor;

  constructor(executor?: TestStepExecutor) {
    this.executor = executor;
  }

  /**
   * Re-runs a failed test case in clean, isolated browser contexts to confirm
   * reproducibility and isolate flaky tests.
   */
  public async verifyReproducibility(
    browser: Browser,
    testCase: TestCase,
    testRunId: string,
    attempts = 2
  ): Promise<ReproductionOutcome> {
    const executions: TestExecution[] = [];
    let failureCount = 0;

    for (let i = 0; i < attempts; i++) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true,
      });

      try {
        const page: Page = await context.newPage();
        if (!this.executor) {
          throw new Error('ControlledReproducer: No TestStepExecutor provided to executeTestCase');
        }
        const exec = await this.executor.executeTestCase(page, testCase, testRunId);
        executions.push(exec);
        if (exec.status === 'FAILED') {
          failureCount++;
        }
      } finally {
        await context.close().catch(() => {});
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
