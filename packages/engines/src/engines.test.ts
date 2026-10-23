import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  AccessibilityEngine,
  SecurityEngine,
  PerformanceEngine,
  FunctionalEngine,
  VisualRegressionEngine,
  AIExploratoryAgent,
  DesignComparator,
} from './index.js';

describe('TestPilot Engines Suite', () => {
  it('instantiates all engines cleanly without errors', () => {
    const a11y = new AccessibilityEngine();
    const security = new SecurityEngine();
    const performance = new PerformanceEngine();
    const functional = new FunctionalEngine();
    const visual = new VisualRegressionEngine();
    const agent = new AIExploratoryAgent();
    const comparator = new DesignComparator();

    assert.ok(a11y);
    assert.ok(security);
    assert.ok(performance);
    assert.ok(functional);
    assert.ok(visual);
    assert.ok(agent);
    assert.ok(comparator);

    const presets = comparator.getPresets();
    assert.ok(presets.length >= 3, 'Should provide at least 3 benchmark design presets');
    assert.ok(presets.some((p) => p.category === 'FIGMA'));
    assert.ok(presets.some((p) => p.category === 'AI'));
  });

  it('generates synthetic test cases from discovered pages using AIExploratoryAgent', () => {
    const agent = new AIExploratoryAgent();
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
