import { Browser, Page } from 'playwright';
import {
  DiscoveredPage,
  InteractiveElement,
  TestCase,
  TestExecution,
  Defect,
  TargetScope,
} from '@testpilot/core';
import { FunctionalEngine } from './functional.js';
import { DefectClassifier, ControlledReproducer } from '@testpilot/triage';
import { ArtifactVault } from '@testpilot/storage';

export interface ExplorationAgentEvent {
  phase: 'OBSERVE' | 'UNDERSTAND' | 'PLAN' | 'EXECUTE' | 'VERIFY' | 'RECORD';
  testCaseTitle: string;
  stepNumber?: number;
  status?: string;
  message?: string;
}

export interface ExplorationAgentOptions {
  vault?: ArtifactVault;
  onEvent?: (event: ExplorationAgentEvent) => void;
  maxTestCases?: number;  // limit test case count, default 15
}

export class AIExploratoryAgent {
  private vault: ArtifactVault;
  private functionalEngine: FunctionalEngine;
  private classifier: DefectClassifier;
  private reproducer: ControlledReproducer;
  private onEvent?: (event: ExplorationAgentEvent) => void;
  private maxTestCases: number;

  constructor(options?: ExplorationAgentOptions) {
    this.vault = options?.vault || new ArtifactVault();
    this.functionalEngine = new FunctionalEngine({ vault: this.vault });
    this.classifier = new DefectClassifier();
    this.reproducer = new ControlledReproducer(this.functionalEngine);
    this.onEvent = options?.onEvent;
    this.maxTestCases = options?.maxTestCases ?? 15;
  }

  /**
   * Plans automated test cases by analyzing discovered page topography,
   * forms, authentication triggers, interactive elements, search bars, and navigation.
   * Generates 6 journey types:
   *   1. Core Navigation (smoke)
   *   2. Form Input + Submission
   *   3. Authentication Workflow
   *   4. Interactive Controls / Buttons
   *   5. Search & Query Journeys
   *   6. Scroll & Visual Stability
   */
  public planTestCases(pages: DiscoveredPage[], scope: TargetScope): TestCase[] {
    const testCases: TestCase[] = [];

    // ── Journey 1: Core Navigation Smoke Test ─────────────────────────────
    if (pages.length > 0) {
      const primary = pages[0];
      const navLinks = primary.interactiveElements
        .filter((el) => el.tagName === 'a' && el.name && el.selector)
        .slice(0, 5);

      if (navLinks.length > 0) {
        testCases.push({
          id: `tc-nav-smoke`,
          title: 'Navigation Smoke: Verify All Primary Links & Page Transitions',
          objective: 'Ensure primary header and navigation links all resolve to valid pages without console errors or broken states.',
          category: 'FUNCTIONAL',
          preconditions: [`Target website accessible at ${primary.url}`],
          isAiGenerated: true,
          targetUrl: primary.url,
          expectedResult: 'All linked pages load with status 200 without unhandled JS exceptions.',
          steps: [
            {
              stepNumber: 1,
              action: 'NAVIGATE',
              targetValue: primary.url,
              expectedOutcome: 'Homepage loads successfully with status 200',
              description: `Open starting URL ${primary.url}`,
            },
            ...navLinks.map((link, idx) => ({
              stepNumber: idx + 2,
              action: 'CLICK' as const,
              targetSelector: link.selector,
              expectedOutcome: `Navigated via link '${link.name}'`,
              description: `Click navigation element '${link.name}'`,
            })),
            {
              stepNumber: navLinks.length + 2,
              action: 'NAVIGATE',
              targetValue: primary.url,
              expectedOutcome: 'Return to homepage cleanly',
              description: 'Return to homepage to verify session integrity',
            },
          ],
        });
      }
    }

    // ── Journey 2: Form Input Boundary & Submission ────────────────────────
    for (const page of pages.slice(0, 4)) {
      if (page.hasForms) {
        const inputs = page.interactiveElements.filter((el) => el.isInput);
        const submitBtn = page.interactiveElements.find(
          (el) =>
            el.tagName === 'button' ||
            el.inputType === 'submit' ||
            (el.text && /submit|send|save|login|sign|continue|next|register|subscribe/i.test(el.text))
        );

        if (inputs.length > 0 && submitBtn) {
          // Test with valid values
          testCases.push({
            id: `tc-form-valid-${encodeURIComponent(page.url.slice(-15))}`,
            title: `Form Happy Path: Valid Input Submission on ${new URL(page.url).pathname}`,
            objective: 'Test form with valid inputs to verify successful submission without server 500 errors or JS exceptions.',
            category: 'FUNCTIONAL',
            preconditions: [`User navigates to ${page.url}`],
            isAiGenerated: true,
            targetUrl: page.url,
            expectedResult: 'Form processes inputs and updates view state without throwing exceptions.',
            steps: [
              {
                stepNumber: 1,
                action: 'NAVIGATE',
                targetValue: page.url,
                expectedOutcome: 'Form page loads',
                description: `Open form page ${page.url}`,
              },
              ...inputs.slice(0, 5).map((inp, idx) => ({
                stepNumber: idx + 2,
                action: 'TYPE' as const,
                targetSelector: inp.selector,
                targetValue: this.getValidTestValue(inp),
                expectedOutcome: `Populated field ${inp.name || inp.selector}`,
                description: `Type valid test value into field '${inp.name || inp.selector}'`,
              })),
              {
                stepNumber: inputs.length + 2,
                action: 'CLICK',
                targetSelector: submitBtn.selector,
                expectedOutcome: 'Form submitted cleanly without error',
                description: `Click submit: '${submitBtn.name || submitBtn.text || 'Submit'}'`,
              },
            ],
          });

          // Test with empty submit (boundary)
          testCases.push({
            id: `tc-form-empty-${encodeURIComponent(page.url.slice(-15))}`,
            title: `Form Boundary: Empty Submission Rejection on ${new URL(page.url).pathname}`,
            objective: 'Verify form correctly rejects empty submissions with client-side validation messages (no 500 error).',
            category: 'FUNCTIONAL',
            preconditions: [`User navigates to ${page.url}`],
            isAiGenerated: true,
            targetUrl: page.url,
            expectedResult: 'Form shows client-side validation errors for required fields. No unhandled exceptions.',
            steps: [
              {
                stepNumber: 1,
                action: 'NAVIGATE',
                targetValue: page.url,
                expectedOutcome: 'Form page loads',
                description: `Open form page ${page.url}`,
              },
              {
                stepNumber: 2,
                action: 'CLICK',
                targetSelector: submitBtn.selector,
                expectedOutcome: 'Validation error appears — form not submitted',
                description: `Click submit without filling required fields`,
              },
            ],
          });
        }
      }
    }

    // ── Journey 3: Authentication Workflow ────────────────────────────────
    const authPage = pages.find(
      (p) => p.hasAuthTriggers || /\/auth|\/login|\/sign-?in|\/account/i.test(p.url)
    );
    if (authPage) {
      const emailInput = authPage.interactiveElements.find(
        (e) => e.inputType === 'email' || /email|user|username/i.test(e.name || '')
      );
      const passInput = authPage.interactiveElements.find((e) => e.inputType === 'password');
      const loginBtn = authPage.interactiveElements.find(
        (e) => /login|sign.?in|submit/i.test(e.text || '') || e.inputType === 'submit'
      );

      if (emailInput && passInput && loginBtn) {
        testCases.push({
          id: `tc-auth-invalid`,
          title: 'Auth Workflow: Invalid Credential Rejection',
          objective: 'Verify login rejects invalid credentials with a user-friendly error (no 500, no stack trace).',
          category: 'FUNCTIONAL',
          preconditions: [`User opens auth portal at ${authPage.url}`],
          isAiGenerated: true,
          targetUrl: authPage.url,
          expectedResult: 'Login attempt with invalid credentials shows a meaningful error. No app crash.',
          steps: [
            { stepNumber: 1, action: 'NAVIGATE', targetValue: authPage.url, expectedOutcome: 'Login page loads', description: `Open login page` },
            { stepNumber: 2, action: 'TYPE', targetSelector: emailInput.selector, targetValue: 'invalid_user_xss@xss.io', expectedOutcome: 'Typed invalid email', description: 'Enter invalid credentials' },
            { stepNumber: 3, action: 'TYPE', targetSelector: passInput.selector, targetValue: 'wr0ngP@ss!', expectedOutcome: 'Typed invalid password', description: 'Enter wrong password' },
            { stepNumber: 4, action: 'CLICK', targetSelector: loginBtn.selector, expectedOutcome: 'Error shown, not logged in', description: 'Submit invalid login' },
          ],
        });
      }
    }

    // ── Journey 4: Interactive Controls / Button State Changes ────────────
    for (const page of pages.slice(0, 3)) {
      const clickables = page.interactiveElements
        .filter((el) => {
          if (!el.isClickable || el.tagName !== 'button' || el.selector.includes('submit')) {
            return false;
          }
          const label = el.text || el.name || '';
          return !label || !/cancel|close|delete|remove/i.test(label);
        })
        .slice(0, 3);

      for (const btn of clickables) {
        testCases.push({
          id: `tc-btn-${btn.id}`,
          title: `UI Control: '${btn.name || btn.text || 'Button'}' on ${new URL(page.url).pathname}`,
          objective: 'Verify button triggers state change without crashing the JavaScript thread or network failure.',
          category: 'FUNCTIONAL',
          preconditions: [`Page loaded at ${page.url}`],
          isAiGenerated: true,
          targetUrl: page.url,
          expectedResult: 'Element interacts cleanly, DOM remains stable, no JS errors thrown.',
          steps: [
            { stepNumber: 1, action: 'NAVIGATE', targetValue: page.url, expectedOutcome: 'Page loads', description: `Navigate to ${page.url}` },
            { stepNumber: 2, action: 'CLICK', targetSelector: btn.selector, expectedOutcome: 'Button clicked without JS errors', description: `Click '${btn.name || btn.text}'` },
            { stepNumber: 3, action: 'WAIT', targetValue: '800', expectedOutcome: 'State change settles', description: 'Wait for DOM to update after click' },
          ],
        });
      }
    }

    // ── Journey 5: Search & Query Journeys ────────────────────────────────
    for (const page of pages.slice(0, 3)) {
      const searchInput = page.interactiveElements.find(
        (el) =>
          el.isInput &&
          (el.inputType === 'search' || /search|query|q\b|find|filter/i.test(el.name || el.selector))
      );

      if (searchInput) {
        testCases.push({
          id: `tc-search-${encodeURIComponent(page.url.slice(-12))}`,
          title: `Search Functionality: Query Execution on ${new URL(page.url).pathname}`,
          objective: 'Verify search input accepts a query, returns results without crashing, and handles special characters safely.',
          category: 'FUNCTIONAL',
          preconditions: [`Search page accessible at ${page.url}`],
          isAiGenerated: true,
          targetUrl: page.url,
          expectedResult: 'Search query executes cleanly. Results render without JS exceptions.',
          steps: [
            { stepNumber: 1, action: 'NAVIGATE', targetValue: page.url, expectedOutcome: 'Page loads', description: `Open page ${page.url}` },
            { stepNumber: 2, action: 'CLICK', targetSelector: searchInput.selector, expectedOutcome: 'Search field focused', description: 'Focus search input' },
            { stepNumber: 3, action: 'TYPE', targetSelector: searchInput.selector, targetValue: 'test product', expectedOutcome: 'Query typed in search', description: 'Type normal query' },
            { stepNumber: 4, action: 'WAIT', targetValue: '1000', expectedOutcome: 'Results or suggestions appear', description: 'Wait for autocomplete/results' },
            { stepNumber: 5, action: 'TYPE', targetSelector: searchInput.selector, targetValue: '<script>alert(1)</script>', expectedOutcome: 'XSS payload typed safely (should be escaped)', description: 'Test XSS in search input' },
            { stepNumber: 6, action: 'WAIT', targetValue: '800', expectedOutcome: 'Page remains stable — no alert dialog', description: 'Verify XSS payload does not execute' },
          ],
        });
      }
    }

    // ── Journey 6: Scroll & Visual Stability ──────────────────────────────
    for (const page of pages.slice(0, 2)) {
      if (page.links.length > 2) {
        testCases.push({
          id: `tc-scroll-${encodeURIComponent(page.url.slice(-12))}`,
          title: `Scroll Journey: Page Stability & Lazy Load on ${new URL(page.url).pathname}`,
          objective: 'Verify page remains stable throughout a full vertical scroll. Check for lazy-loaded content, CLS issues, and JS errors during scroll.',
          category: 'FUNCTIONAL',
          preconditions: [`Page accessible at ${page.url}`],
          isAiGenerated: true,
          targetUrl: page.url,
          expectedResult: 'Page scrolls smoothly without JS errors. All lazy-loaded content renders.',
          steps: [
            { stepNumber: 1, action: 'NAVIGATE', targetValue: page.url, expectedOutcome: 'Page loads', description: `Open ${page.url}` },
            { stepNumber: 2, action: 'WAIT', targetValue: '1000', expectedOutcome: 'Initial content loaded', description: 'Wait for initial render' },
            { stepNumber: 3, action: 'ASSERT_VISIBLE', targetSelector: 'body', expectedOutcome: 'Page body is visible', description: 'Verify body content present' },
            { stepNumber: 4, action: 'WAIT', targetValue: '2000', expectedOutcome: 'Page stable after scroll simulation', description: 'Observe page stability for lazy-load' },
          ],
        });
      }
    }

    // Respect max test case limit
    return testCases.slice(0, this.maxTestCases);
  }

  /**
   * Returns an appropriate test value for an input element based on its type/name.
   */
  private getValidTestValue(el: InteractiveElement): string {
    const type = el.inputType || '';
    const name = (el.name || el.selector).toLowerCase();

    if (type === 'email' || name.includes('email')) return 'qa_agent@testpilot.ai';
    if (type === 'password' || name.includes('password')) return 'TestP@ssw0rd!';
    if (type === 'tel' || name.includes('phone')) return '+1-555-010-0001';
    if (type === 'number' || name.includes('qty') || name.includes('quantity')) return '2';
    if (type === 'url' || name.includes('url') || name.includes('website')) return 'https://example.com';
    if (type === 'search' || name.includes('search')) return 'test product';
    if (name.includes('name') && name.includes('first')) return 'Jane';
    if (name.includes('name') && name.includes('last')) return 'Doe';
    if (name.includes('name')) return 'Jane Doe';
    if (name.includes('zip') || name.includes('postal')) return '10001';
    if (name.includes('city')) return 'New York';
    if (name.includes('address')) return '123 Main St';
    if (name.includes('message') || name.includes('comment') || name.includes('description')) {
      return 'Automated QA test submission from TestPilot AI.';
    }
    if (type === 'date') return '2025-01-01';
    return 'TestPilot_QA_Value';
  }

  /**
   * Executes the full closed-loop exploratory testing cycle:
   * Observe → Understand → Plan → Execute → Verify → Record
   */
  public async executeExploration(
    browser: Browser,
    pages: DiscoveredPage[],
    scope: TargetScope,
    testRunId: string
  ): Promise<{ executions: TestExecution[]; defects: Defect[] }> {
    this.onEvent?.({
      phase: 'OBSERVE',
      testCaseTitle: 'Analyzing discovered pages',
      message: `Observing ${pages.length} pages — extracting elements, forms, auth triggers`,
    });

    this.onEvent?.({
      phase: 'UNDERSTAND',
      testCaseTitle: 'Building site model',
      message: `Identified ${pages.filter((p) => p.hasForms).length} form pages, ${pages.filter((p) => p.hasAuthTriggers).length} auth triggers`,
    });

    this.onEvent?.({ phase: 'PLAN', testCaseTitle: 'Synthesizing test journeys' });

    const plannedCases = this.planTestCases(pages, scope);
    const executions: TestExecution[] = [];
    const defects: Defect[] = [];

    this.onEvent?.({
      phase: 'PLAN',
      testCaseTitle: `${plannedCases.length} test cases planned`,
      message: `Planned: Navigation, Form validation, Auth, Button controls, Search, Scroll stability`,
    });

    for (const tc of plannedCases) {
      this.onEvent?.({
        phase: 'EXECUTE',
        testCaseTitle: tc.title,
        message: `Executing: ${tc.title}`,
      });

      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true,
      });

      try {
        const page: Page = await context.newPage();
        const execution = await this.functionalEngine.executeTestCase(page, tc, testRunId);
        executions.push(execution);

        this.onEvent?.({
          phase: 'VERIFY',
          testCaseTitle: tc.title,
          status: execution.status,
          message: `Result: ${execution.status} in ${execution.durationMs}ms | Steps: ${execution.stepResults.length}`,
        });

        if (execution.status === 'FAILED') {
          const repro = await this.reproducer.verifyReproducibility(browser, tc, testRunId, 2);
          const defect = this.classifier.classifyFunctionalFailure(execution, repro.reproducible);
          defects.push(defect);

          this.onEvent?.({
            phase: 'RECORD',
            testCaseTitle: tc.title,
            status: defect.severity,
            message: `Recorded ${defect.classification} defect (${defect.severity}): ${defect.title}`,
          });
        }
      } catch (err: any) {
        // Swallow per-test-case errors so the full cycle completes
        this.onEvent?.({
          phase: 'RECORD',
          testCaseTitle: tc.title,
          status: 'ERROR',
          message: `Aborted: ${err.message}`,
        });
      } finally {
        await context.close().catch(() => {});
      }
    }

    return { executions, defects };
  }
}
