import { Defect, Severity, TestExecution, AccessibilityViolation, SecurityFinding, VisualDiffResult } from '@testpilot/core';
export declare class DefectClassifier {
    private hashString;
    /**
     * Triages a failed functional test execution.
     */
    classifyFunctionalFailure(execution: TestExecution, reproducible?: boolean): Defect;
    /**
     * Triages an accessibility violation.
     */
    classifyA11yViolation(violation: AccessibilityViolation, targetUrl: string, testRunId: string): Defect;
    /**
     * Triages a visual regression mismatch.
     */
    classifyVisualRegression(result: VisualDiffResult & {
        pageName?: string;
        diffSummary?: string;
    }, targetUrl: string, testRunId: string): Defect;
    /**
     * Triages a performance issue detected by the PerformanceEngine.
     */
    classifyPerformanceIssue(issue: {
        type: string;
        severity: Severity;
        title: string;
        description: string;
        measured: number;
        threshold: number;
        unit: string;
    }, targetUrl: string, testRunId: string): Defect;
    /**
     * Triages a security finding.
     */
    classifySecurityFinding(finding: SecurityFinding, targetUrl: string, testRunId: string): Defect;
}
//# sourceMappingURL=classifier.d.ts.map