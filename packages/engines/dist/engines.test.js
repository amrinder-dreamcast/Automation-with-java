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
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const index_js_1 = require("./index.js");
(0, node_test_1.describe)('TestPilot Engines Suite', () => {
    (0, node_test_1.it)('instantiates all engines cleanly without errors', () => {
        const a11y = new index_js_1.AccessibilityEngine();
        const security = new index_js_1.SecurityEngine();
        const performance = new index_js_1.PerformanceEngine();
        const functional = new index_js_1.FunctionalEngine();
        const visual = new index_js_1.VisualRegressionEngine();
        const agent = new index_js_1.AIExploratoryAgent();
        const comparator = new index_js_1.DesignComparator();
        assert.ok(a11y);
        assert.ok(security);
        assert.ok(performance);
        assert.ok(functional);
        assert.ok(visual);
        assert.ok(agent);
        assert.ok(comparator);
        const presets = comparator.getPresets();
        assert.ok(presets.length >= 5, 'Should provide at least 5 benchmark design presets');
        assert.ok(presets.some((p) => p.category === 'FIGMA'));
        assert.ok(presets.some((p) => p.category === 'AI'));
        assert.ok(presets.some((p) => p.category === 'XD'));
        assert.ok(presets.some((p) => p.category === 'PHOTOSHOP'));
    });
    (0, node_test_1.it)('generates synthetic test cases from discovered pages using AIExploratoryAgent', () => {
        const agent = new index_js_1.AIExploratoryAgent();
        const scope = {
            id: 'scope-1',
            projectId: 'proj-1',
            primaryUrl: 'http://localhost:4000/',
            allowedDomains: ['localhost'],
            allowSubdomains: false,
            allowExternalLinks: false,
            maxCrawlDepth: 2,
            maxPages: 10,
            crawlTimeoutMs: 10000,
            allowLocalTargets: true,
        };
        const pages = [
            {
                url: 'http://localhost:4000/',
                title: 'Home',
                depth: 0,
                statusCode: 200,
                loadTimeMs: 120,
                links: ['http://localhost:4000/broken-links'],
                interactiveElements: [
                    {
                        id: 'elem-1',
                        pageUrl: 'http://localhost:4000/',
                        tagName: 'a',
                        role: 'link',
                        name: 'Broken Links',
                        selector: '#nav-broken-links',
                        isClickable: true,
                        isInput: false,
                    },
                    {
                        id: 'elem-2',
                        pageUrl: 'http://localhost:4000/',
                        tagName: 'button',
                        role: 'button',
                        name: 'Increment Counter',
                        selector: '#counter-btn',
                        isClickable: true,
                        isInput: false,
                    },
                ],
                hasForms: false,
                hasAuthTriggers: false,
                domHash: 'hash-home',
            },
        ];
        const testCases = agent.planTestCases(pages, scope);
        assert.ok(testCases.length >= 2, `Expected at least 2 test cases, got ${testCases.length}`);
        const navSmoke = testCases.find((tc) => tc.id === 'tc-nav-smoke');
        assert.ok(navSmoke, 'Navigation smoke journey should be generated');
        assert.strictEqual(navSmoke.category, 'FUNCTIONAL');
    });
});
//# sourceMappingURL=engines.test.js.map