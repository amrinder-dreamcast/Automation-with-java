"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefectClassifier = void 0;
const crypto = __importStar(require("node:crypto"));
class DefectClassifier {
    hashString(str) {
        return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
    }
    /**
     * Triages a failed functional test execution.
     */
    classifyFunctionalFailure(execution, reproducible = true) {
        const failedStep = execution.stepResults.find((s) => s.status === 'FAILED') || execution.stepResults[execution.stepResults.length - 1];
        const isAuth = execution.testCaseTitle.toLowerCase().includes('auth') || execution.testCaseTitle.toLowerCase().includes('login');
        const is500Error = execution.networkFailures.some((n) => n.status >= 500) || (failedStep?.actualResult || '').includes('500');
        // Severity Rubric
        let severity = 'P2';
        if (isAuth || is500Error) {
            severity = 'P1';
        }
        else if (failedStep?.action === 'CLICK' && failedStep.errorMessage?.includes('Timeout')) {
            severity = 'P2';
        }
        const classification = reproducible ? 'CONFIRMED' : 'FLAKY';
        const confidenceScore = reproducible ? 0.95 : 0.60;
        const evidence = [];
        if (failedStep?.screenshotPath) {
            evidence.push({
                id: `ev-${Math.random().toString(36).substring(2, 9)}`,
                defectId: '',
                type: 'SCREENSHOT',
                artifactPath: failedStep.screenshotPath,
                caption: `Failure state during step ${failedStep.stepNumber} (${failedStep.action})`,
            });
        }
        const fingerprint = this.hashString(`func:${execution.testCaseId}:${failedStep?.action}:${failedStep?.errorMessage || ''}`);
        const rootCauseAnalysis = [
            `1. Action '${failedStep?.action}' failed at step ${failedStep?.stepNumber}.`,
            `2. Error: ${failedStep?.errorMessage || 'Assertion failed'}.`,
            execution.consoleLogs.length > 0 ? `3. Client-side console captured ${execution.consoleLogs.length} error/warning logs.` : '',
            execution.networkFailures.length > 0 ? `4. Network request failed: ${execution.networkFailures.map((n) => `${n.method} ${n.url} (${n.status})`).join(', ')}` : '',
        ].filter(Boolean).join('\n');
        const reproductionSteps = execution.stepResults.map((s) => `Step ${s.stepNumber}: ${s.action} - ${s.actualResult}`);
        return {
            id: `def-${Math.random().toString(36).substring(2, 10)}`,
            testRunId: execution.testRunId,
            title: `[Functional] ${execution.testCaseTitle} - Step ${failedStep?.stepNumber || 1} Failed`,
            summary: failedStep?.errorMessage || 'Expected element or condition was not satisfied.',
            category: 'FUNCTIONAL',
            severity,
            classification,
            confidenceScore,
            affectedUrl: execution.networkFailures[0]?.url || 'Target page',
            browser: 'Chromium',
            reproductionStatus: reproducible ? 'REPRODUCIBLE' : 'INTERMITTENT',
            reproductionSteps,
            expectedBehavior: 'All workflow steps should complete without unhandled exceptions or assertion failures.',
            actualBehavior: failedStep?.actualResult || 'Step failed unexpectedly.',
            rootCauseAnalysis,
            likelyCauseExplanation: is500Error
                ? 'Backend endpoint responded with 500 Internal Server Error, terminating the client workflow.'
                : 'DOM element was either not rendered in time, disabled, or an unexpected runtime exception interrupted the event handler.',
            suggestedFix: is500Error
                ? 'Inspect backend server logs for the failing endpoint and add graceful client error boundaries.'
                : 'Verify selector stability, ensure loading skeletons complete, and check click handler exception handling.',
            fingerprint,
            evidence,
            firstSeenAt: execution.startedAt,
            lastSeenAt: execution.completedAt,
            status: 'OPEN',
        };
    }
    /**
     * Triages an accessibility violation.
     */
    classifyA11yViolation(violation, targetUrl, testRunId) {
        let severity = 'P3';
        if (violation.impact === 'critical')
            severity = 'P1';
        else if (violation.impact === 'serious')
            severity = 'P2';
        else if (violation.impact === 'minor')
            severity = 'P4';
        const fingerprint = this.hashString(`a11y:${violation.id}:${targetUrl}`);
        return {
            id: `def-${Math.random().toString(36).substring(2, 10)}`,
            testRunId,
            title: `[Accessibility] ${violation.help} (${violation.id})`,
            summary: violation.description,
            category: 'ACCESSIBILITY',
            severity,
            classification: 'CONFIRMED',
            confidenceScore: 0.98,
            affectedUrl: targetUrl,
            browser: 'Chromium',
            reproductionStatus: 'REPRODUCIBLE',
            reproductionSteps: [
                `1. Navigate to ${targetUrl}`,
                `2. Inspect DOM elements: ${violation.nodes.map((n) => n.target.join(' ')).join(', ')}`,
                `3. Observe violation of WCAG standard: ${violation.id}`,
            ],
            expectedBehavior: `Compliant with WCAG standard: ${violation.help}`,
            actualBehavior: violation.nodes[0]?.failureSummary || violation.description,
            rootCauseAnalysis: `Axe-core rule '${violation.id}' flagged ${violation.nodes.length} element(s). Impact: ${violation.impact}.`,
            likelyCauseExplanation: 'Element lacks required accessibility attributes (e.g. alt text, aria label, or sufficient color contrast).',
            suggestedFix: `Review WCAG guidance: ${violation.helpUrl}. Update markup for: ${violation.nodes[0]?.html || 'target element'}.`,
            fingerprint,
            evidence: [],
            firstSeenAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
            status: 'OPEN',
        };
    }
    /**
     * Triages a visual regression mismatch.
     */
    classifyVisualRegression(result, targetUrl, testRunId) {
        const severity = result.mismatchPercentage > 15.0 ? 'P1' : result.mismatchPercentage > 5.0 ? 'P2' : 'P3';
        const fingerprint = this.hashString(`vis:${targetUrl}:${result.pageName || result.diffPixelCount}`);
        const evidence = [];
        if (result.diffPath) {
            evidence.push({
                id: `ev-${Math.random().toString(36).substring(2, 9)}`,
                defectId: '',
                type: 'VISUAL_DIFF',
                artifactPath: result.diffPath,
                caption: `Visual diff highlighting ${result.diffPixelCount} differing pixels (${result.mismatchPercentage.toFixed(2)}%)`,
            });
        }
        return {
            id: `def-${Math.random().toString(36).substring(2, 10)}`,
            testRunId,
            title: `[Visual] Layout Regression Detected on ${result.pageName || targetUrl} (${result.mismatchPercentage.toFixed(1)}% mismatch)`,
            summary: result.diffSummary || `Perceptual diff detected ${result.diffPixelCount.toLocaleString()} differing pixels compared to verified baseline.`,
            category: 'VISUAL',
            severity,
            classification: 'CONFIRMED',
            confidenceScore: 0.95,
            affectedUrl: targetUrl,
            browser: 'Chromium',
            reproductionStatus: 'REPRODUCIBLE',
            reproductionSteps: [
                `1. Navigate to ${targetUrl} at standard viewport (1280x800).`,
                `2. Capture viewport screenshot.`,
                `3. Compare against baseline image (${result.baselinePath || 'established baseline'}).`,
                `4. Observed ${result.mismatchPercentage.toFixed(2)}% pixel differential (${result.diffPixelCount} differing pixels).`,
            ],
            expectedBehavior: 'Candidate rendering should match baseline screenshot within tolerance.',
            actualBehavior: `${result.mismatchPercentage.toFixed(2)}% of pixels deviated from baseline (${result.diffPixelCount.toLocaleString()} differing pixels).`,
            rootCauseAnalysis: `Diff engine detected layout shift or visual styling discrepancies. Displaced pixels: ${result.diffPixelCount.toLocaleString()}.`,
            likelyCauseExplanation: 'CSS stylesheet changes, unannounced typography/padding shifts, or dynamic DOM banners altered page geometry.',
            suggestedFix: 'Inspect the generated visual diff artifact to determine if styling shift was intentional. If intentional, approve new baseline; otherwise restore CSS rules.',
            fingerprint,
            evidence,
            firstSeenAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
            status: 'OPEN',
        };
    }
    /**
     * Triages a performance issue detected by the PerformanceEngine.
     */
    classifyPerformanceIssue(issue, targetUrl, testRunId) {
        const fingerprint = this.hashString(`perf:${issue.type}:${targetUrl}`);
        const unitLabel = issue.unit === 'ms' ? `${issue.measured}ms (threshold: ${issue.threshold}ms)` :
            issue.unit === 'bytes' ? `${(issue.measured / 1024 / 1024).toFixed(1)}MB` :
                `${issue.measured} (threshold: ${issue.threshold})`;
        return {
            id: `def-${Math.random().toString(36).substring(2, 10)}`,
            testRunId,
            title: `[Performance] ${issue.title}`,
            summary: issue.description,
            category: 'PERFORMANCE',
            severity: issue.severity,
            classification: 'CONFIRMED',
            confidenceScore: 0.90,
            affectedUrl: targetUrl,
            browser: 'Chromium',
            reproductionStatus: 'REPRODUCIBLE',
            reproductionSteps: [
                `1. Navigate to ${targetUrl} in a clean browser session.`,
                `2. Open DevTools → Performance panel.`,
                `3. Measure: ${issue.type} → ${unitLabel}`,
            ],
            expectedBehavior: `${issue.type} should be within the acceptable threshold of ${issue.threshold} ${issue.unit}.`,
            actualBehavior: `Measured ${issue.measured} ${issue.unit}, which exceeds the threshold by ${Math.round((issue.measured / issue.threshold - 1) * 100)}%.`,
            rootCauseAnalysis: issue.description,
            likelyCauseExplanation: 'Possible causes include unoptimised images, render-blocking scripts, slow server response, excessive DOM size, or third-party resource latency.',
            suggestedFix: 'Profile the page with Chrome DevTools Lighthouse. Optimise critical rendering path: compress images, defer non-critical scripts, enable CDN caching, and minimise main-thread work.',
            fingerprint,
            evidence: [],
            firstSeenAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
            status: 'OPEN',
        };
    }
    /**
     * Triages a security finding.
     */
    classifySecurityFinding(finding, targetUrl, testRunId) {
        const fingerprint = this.hashString(`sec:${finding.type}:${targetUrl}`);
        return {
            id: `def-${Math.random().toString(36).substring(2, 10)}`,
            testRunId,
            title: `[Security] ${finding.title}`,
            summary: finding.description,
            category: 'SECURITY',
            severity: finding.severity,
            classification: 'CONFIRMED',
            confidenceScore: 0.99,
            affectedUrl: targetUrl,
            browser: 'Chromium',
            reproductionStatus: 'REPRODUCIBLE',
            reproductionSteps: [
                `1. Request ${targetUrl} via HTTP client.`,
                `2. Inspect response headers and payload.`,
                `3. Verify evidence: ${finding.evidence}`,
            ],
            expectedBehavior: 'HTTP headers and cookies should adhere to security hardening best practices.',
            actualBehavior: finding.evidence,
            rootCauseAnalysis: finding.description,
            likelyCauseExplanation: 'Web server or reverse proxy is configured with missing security headers or unflagged session cookies.',
            suggestedFix: finding.recommendation,
            fingerprint,
            evidence: [],
            firstSeenAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
            status: 'OPEN',
        };
    }
}
exports.DefectClassifier = DefectClassifier;
//# sourceMappingURL=classifier.js.map