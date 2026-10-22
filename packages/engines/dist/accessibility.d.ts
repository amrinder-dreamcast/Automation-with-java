import { Page } from 'playwright';
import { AccessibilityViolation } from '@testpilot/core';
export interface A11yAuditOptions {
    tags?: string[];
    disableRules?: string[];
    waitForMs?: number;
}
export declare class AccessibilityEngine {
    private axeSource;
    private getAxeSource;
    /**
     * Evaluates the accessibility of a page using industry-standard axe-core rules
     * covering WCAG 2.1 Level A, Level AA, WCAG 2.2, and best practices.
     * Returns violations sorted by impact severity.
     */
    auditPage(page: Page, options?: A11yAuditOptions): Promise<AccessibilityViolation[]>;
    /**
     * Maps axe-core impact level to TestPilot severity (P1-P4).
     */
    impactToSeverity(impact: string): 'P1' | 'P2' | 'P3' | 'P4';
    /**
     * Groups violations by WCAG criterion for a structured report.
     */
    groupByWcagCriterion(violations: AccessibilityViolation[]): Map<string, AccessibilityViolation[]>;
}
//# sourceMappingURL=accessibility.d.ts.map