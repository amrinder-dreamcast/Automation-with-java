import { Page } from 'playwright';
import * as fs from 'node:fs/promises';
import { AccessibilityViolation } from '@testpilot/core';

export interface A11yAuditOptions {
  tags?: string[];          // axe rule tags to run, default: WCAG 2.1 A + AA + best practice
  disableRules?: string[];  // specific rule IDs to skip
  waitForMs?: number;       // wait before audit fires, useful for animated content
}

const IMPACT_TO_SEVERITY: Record<string, 'P1' | 'P2' | 'P3' | 'P4'> = {
  critical: 'P1',
  serious: 'P2',
  moderate: 'P3',
  minor: 'P4',
};

export class AccessibilityEngine {
  private axeSource: string | null = null;

  private async getAxeSource(): Promise<string> {
    if (!this.axeSource) {
      const axePath = require.resolve('axe-core/axe.min.js');
      this.axeSource = await fs.readFile(axePath, 'utf-8');
    }
    return this.axeSource;
  }

  /**
   * Evaluates the accessibility of a page using industry-standard axe-core rules
   * covering WCAG 2.1 Level A, Level AA, WCAG 2.2, and best practices.
   * Returns violations sorted by impact severity.
   */
  public async auditPage(page: Page, options?: A11yAuditOptions): Promise<AccessibilityViolation[]> {
    const axeScript = await this.getAxeSource();

    // Settle any animations / lazy-loaded content
    if (options?.waitForMs && options.waitForMs > 0) {
      await page.waitForTimeout(Math.min(options.waitForMs, 3000));
    }

    // Inject axe-core into the active page DOM
    await page.evaluate((script) => {
      const el = document.createElement('script');
      el.textContent = script;
      document.head.appendChild(el);
    }, axeScript);

    const tags = options?.tags ?? ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
    const disableRules = options?.disableRules ?? [];

    // Run axe audit within the browser context
    const rawResults = await page.evaluate(async ({ tags, disableRules }) => {
      // @ts-ignore
      if (typeof window.axe === 'undefined') {
        throw new Error('axe-core was not injected properly into page');
      }

      const rulesConfig: Record<string, { enabled: boolean }> = {};
      for (const rule of disableRules) {
        rulesConfig[rule] = { enabled: false };
      }

      // @ts-ignore
      const res = await window.axe.run(document, {
        runOnly: { type: 'tag', values: tags },
        rules: rulesConfig,
        resultTypes: ['violations', 'incomplete'],
      });

      return {
        violations: res.violations,
        incomplete: res.incomplete,
        passes: res.passes?.length ?? 0,
        violationCount: res.violations?.length ?? 0,
      };
    }, { tags, disableRules });

    const violations: AccessibilityViolation[] = (rawResults.violations || []).map((v: any) => ({
      id: v.id,
      impact: v.impact || 'minor',
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      tags: v.tags || [],
      nodes: (v.nodes || []).map((n: any) => ({
        html: n.html,
        target: n.target || [],
        failureSummary: n.failureSummary || '',
      })),
    }));

    // Sort: critical → serious → moderate → minor
    const impactOrder: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    violations.sort((a, b) => (impactOrder[a.impact] ?? 4) - (impactOrder[b.impact] ?? 4));

    return violations;
  }

  /**
   * Maps axe-core impact level to TestPilot severity (P1-P4).
   */
  public impactToSeverity(impact: string): 'P1' | 'P2' | 'P3' | 'P4' {
    return IMPACT_TO_SEVERITY[impact] ?? 'P4';
  }

  /**
   * Groups violations by WCAG criterion for a structured report.
   */
  public groupByWcagCriterion(violations: AccessibilityViolation[]): Map<string, AccessibilityViolation[]> {
    const map = new Map<string, AccessibilityViolation[]>();
    for (const v of violations) {
      const wcagTags = v.tags.filter((t) => /wcag\d/.test(t));
      const key = wcagTags.length > 0 ? wcagTags.join(', ') : 'best-practice';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    return map;
  }
}
