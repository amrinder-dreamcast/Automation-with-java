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
exports.AccessibilityEngine = void 0;
const fs = __importStar(require("node:fs/promises"));
const IMPACT_TO_SEVERITY = {
    critical: 'P1',
    serious: 'P2',
    moderate: 'P3',
    minor: 'P4',
};
class AccessibilityEngine {
    axeSource = null;
    async getAxeSource() {
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
    async auditPage(page, options) {
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
            const rulesConfig = {};
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
        const violations = (rawResults.violations || []).map((v) => ({
            id: v.id,
            impact: v.impact || 'minor',
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            tags: v.tags || [],
            nodes: (v.nodes || []).map((n) => ({
                html: n.html,
                target: n.target || [],
                failureSummary: n.failureSummary || '',
            })),
        }));
        // Sort: critical → serious → moderate → minor
        const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
        violations.sort((a, b) => (impactOrder[a.impact] ?? 4) - (impactOrder[b.impact] ?? 4));
        return violations;
    }
    /**
     * Maps axe-core impact level to TestPilot severity (P1-P4).
     */
    impactToSeverity(impact) {
        return IMPACT_TO_SEVERITY[impact] ?? 'P4';
    }
    /**
     * Groups violations by WCAG criterion for a structured report.
     */
    groupByWcagCriterion(violations) {
        const map = new Map();
        for (const v of violations) {
            const wcagTags = v.tags.filter((t) => /wcag\d/.test(t));
            const key = wcagTags.length > 0 ? wcagTags.join(', ') : 'best-practice';
            if (!map.has(key))
                map.set(key, []);
            map.get(key).push(v);
        }
        return map;
    }
}
exports.AccessibilityEngine = AccessibilityEngine;
//# sourceMappingURL=accessibility.js.map