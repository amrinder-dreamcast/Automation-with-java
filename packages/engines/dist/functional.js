"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionalEngine = void 0;
const storage_1 = require("@testpilot/storage");
class FunctionalEngine {
    vault;
    screenshotOnFailure;
    constructor(options) {
        this.vault = options?.vault || new storage_1.ArtifactVault();
        this.screenshotOnFailure = options?.screenshotOnFailure ?? true;
    }
    /**
     * Executes a single test case in a controlled browser page context,
     * tracking step outcomes, console logs, network failures, and taking failure screenshots.
     */
    async executeTestCase(page, testCase, testRunId) {
        const startTime = Date.now();
        const consoleLogs = [];
        const networkFailures = [];
        // Attach listeners
        const onConsole = (msg) => {
            consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                location: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : undefined,
            });
        };
        const onPageError = (err) => {
            consoleLogs.push({
                type: 'uncaught_error',
                text: err.stack || err.message,
            });
        };
        const onRequestFailed = (req) => {
            networkFailures.push({
                url: req.url(),
                method: req.method(),
                status: 0,
                errorText: req.failure()?.errorText || 'Request failed',
            });
        };
        const onResponse = (res) => {
            if (res.status() >= 400) {
                networkFailures.push({
                    url: res.url(),
                    method: res.request().method(),
                    status: res.status(),
                    errorText: `HTTP ${res.status()}`,
                });
            }
        };
        page.on('console', onConsole);
        page.on('pageerror', onPageError);
        page.on('requestfailed', onRequestFailed);
        page.on('response', onResponse);
        const stepResults = [];
        let overallStatus = 'PASSED';
        let failureScreenshotPath;
        try {
            for (const step of testCase.steps) {
                const stepStart = Date.now();
                let stepStatus = 'PASSED';
                let actualResult = '';
                let errorMessage;
                try {
                    switch (step.action) {
                        case 'NAVIGATE':
                            const target = step.targetValue || testCase.targetUrl;
                            await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
                            actualResult = `Navigated to ${target}`;
                            break;
                        case 'CLICK':
                            if (!step.targetSelector)
                                throw new Error('Missing targetSelector for CLICK step');
                            await page.waitForSelector(step.targetSelector, { timeout: 8000, state: 'visible' });
                            await page.click(step.targetSelector, { timeout: 5000 });
                            await page.waitForTimeout(400); // Allow brief microtask settlement
                            actualResult = `Clicked element '${step.targetSelector}'`;
                            break;
                        case 'TYPE':
                            if (!step.targetSelector)
                                throw new Error('Missing targetSelector for TYPE step');
                            await page.waitForSelector(step.targetSelector, { timeout: 8000, state: 'visible' });
                            await page.fill(step.targetSelector, step.targetValue || '');
                            actualResult = `Typed into '${step.targetSelector}'`;
                            break;
                        case 'ASSERT_VISIBLE':
                            if (!step.targetSelector)
                                throw new Error('Missing targetSelector for ASSERT_VISIBLE step');
                            await page.waitForSelector(step.targetSelector, { timeout: 8000, state: 'visible' });
                            actualResult = `Element '${step.targetSelector}' is visible`;
                            break;
                        case 'ASSERT_TEXT':
                            if (!step.targetSelector)
                                throw new Error('Missing targetSelector for ASSERT_TEXT step');
                            const text = await page.textContent(step.targetSelector);
                            if (!text || !text.includes(step.targetValue || '')) {
                                throw new Error(`Expected text '${step.targetValue}' not found in element '${step.targetSelector}' (got '${text?.trim()}')`);
                            }
                            actualResult = `Found expected text '${step.targetValue}' in '${step.targetSelector}'`;
                            break;
                        case 'WAIT':
                            const waitMs = parseInt(step.targetValue || '1000', 10);
                            await page.waitForTimeout(Math.min(waitMs, 5000));
                            actualResult = `Waited ${waitMs}ms`;
                            break;
                        default:
                            actualResult = `Executed action ${step.action}`;
                    }
                    // Check if any critical page errors were thrown during this step
                    const criticalErrors = consoleLogs.filter((l) => l.type === 'uncaught_error' || (l.type === 'error' && !l.text.includes('favicon')));
                    if (criticalErrors.length > 0 && step.action !== 'ASSERT_STATUS') {
                        const latestErr = criticalErrors[criticalErrors.length - 1];
                        stepStatus = 'FAILED';
                        errorMessage = `Client-side exception thrown: ${latestErr.text}`;
                        actualResult = `Triggered unhandled error: ${latestErr.text}`;
                        overallStatus = 'FAILED';
                    }
                }
                catch (stepErr) {
                    stepStatus = 'FAILED';
                    errorMessage = stepErr.message;
                    actualResult = `Failure: ${errorMessage}`;
                    overallStatus = 'FAILED';
                    if (this.screenshotOnFailure) {
                        try {
                            const shot = await page.screenshot({ fullPage: false });
                            const filename = `fail-step-${step.stepNumber}-${testCase.id}`;
                            const saved = await this.vault.saveScreenshot(testRunId, filename, shot);
                            failureScreenshotPath = saved.relativeUrl;
                        }
                        catch {
                            // Ignore failure screenshot error
                        }
                    }
                }
                stepResults.push({
                    stepNumber: step.stepNumber,
                    action: step.action,
                    status: stepStatus,
                    durationMs: Date.now() - stepStart,
                    actualResult,
                    errorMessage,
                    screenshotPath: stepStatus === 'FAILED' ? failureScreenshotPath : undefined,
                });
                if (stepStatus === 'FAILED') {
                    break; // Stop further steps in this test case
                }
            }
        }
        finally {
            // Detach listeners
            page.off('console', onConsole);
            page.off('pageerror', onPageError);
            page.off('requestfailed', onRequestFailed);
            page.off('response', onResponse);
        }
        return {
            id: `exec-${Math.random().toString(36).substring(2, 10)}`,
            testRunId,
            testCaseId: testCase.id,
            testCaseTitle: testCase.title,
            category: testCase.category,
            status: overallStatus,
            durationMs: Date.now() - startTime,
            retryCount: 0,
            startedAt: new Date(startTime).toISOString(),
            completedAt: new Date().toISOString(),
            stepResults,
            consoleLogs,
            networkFailures,
            screenshotPath: failureScreenshotPath,
        };
    }
}
exports.FunctionalEngine = FunctionalEngine;
//# sourceMappingURL=functional.js.map