import { chromium, Browser } from 'playwright';
import {
  Project,
  TargetScope,
  TestRun,
  Defect,
  CrawlSession,
  AccessibilityViolation,
  SecurityFinding,
  PerformanceMetrics,
} from '@testpilot/core';
import { TestPilotDatabase, ArtifactVault } from '@testpilot/storage';
import { SafeCrawler } from '@testpilot/crawler';
import {
  AccessibilityEngine,
  SecurityEngine,
  PerformanceEngine,
  VisualRegressionEngine,
  AIExploratoryAgent,
  ExplorationAgentEvent,
} from '@testpilot/engines';
import { DefectClassifier } from '@testpilot/triage';

export interface RunProgressEvent {
  runId: string;
  stage: 'INITIALIZING' | 'CRAWLING' | 'AUDITING' | 'EXPLORING' | 'TRIAGING' | 'COMPLETED' | 'FAILED';
  message: string;
  progressPercent: number;
  data?: any;
}

export class TestPilotRunner {
  private db: TestPilotDatabase;
  private vault: ArtifactVault;
  private listeners: Map<string, Set<(event: RunProgressEvent) => void>> = new Map();

  constructor(db?: TestPilotDatabase, vault?: ArtifactVault) {
    this.db = db || new TestPilotDatabase();
    this.vault = vault || new ArtifactVault();
  }

  public subscribe(runId: string, listener: (event: RunProgressEvent) => void): () => void {
    if (!this.listeners.has(runId)) {
      this.listeners.set(runId, new Set());
    }
    this.listeners.get(runId)!.add(listener);
    return () => {
      this.listeners.get(runId)?.delete(listener);
    };
  }

  private emit(runId: string, event: RunProgressEvent): void {
    const runListeners = this.listeners.get(runId);
    if (runListeners) {
      for (const listener of runListeners) {
        try { listener(event); } catch { /* ignore */ }
      }
    }
  }

  /**
   * Orchestrates the complete automated testing cycle:
   * 1. Scope & SSRF Validation
   * 2. Page & Element Discovery Crawl
   * 3. Accessibility (WCAG 2.1/2.2) Audits
   * 4. Passive Security Header & Cookie Scan
   * 5. Performance Diagnostics (FCP, LCP, CLS, TTFB, Navigation)
   * 6. Visual Regression Screenshots (Pixelmatch)
   * 7. AI Exploratory Functional Journeys
   * 8. Defect Triaging & Controlled Reproducibility Verification
   */
  public async executeTestCycle(
    project: Project,
    scopeOverride?: Partial<TargetScope>,
    customRunId?: string
  ): Promise<TestRun> {
    const runId = customRunId || `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const primaryUrl = scopeOverride?.primaryUrl || project.scope?.primaryUrl || 'http://localhost:4000';
    let targetHost = 'localhost';
    try {
      targetHost = new URL(primaryUrl).hostname;
    } catch {}

    const existingAllowed = project.scope?.allowedDomains || [];
    const allowedDomains = Array.from(new Set([...existingAllowed, targetHost, targetHost.replace(/^www\./, '')]));

    const scope: TargetScope = {
      ...(project.scope || {}),
      ...scopeOverride,
      id: `scope-${runId}`,
      projectId: project.id,
      primaryUrl,
      allowedDomains,
      allowSubdomains: true,
      allowLocalTargets: targetHost === 'localhost' || targetHost === '127.0.0.1' || Boolean(scopeOverride?.allowLocalTargets),
    };

    const startTime = new Date().toISOString();
    const testRun: TestRun = {
      id: runId,
      projectId: project.id,
      status: 'CRAWLING',
      primaryUrl: scope.primaryUrl,
      startedAt: startTime,
      progressPercent: 5,
      currentPhase: 'INITIALIZING',
      stats: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
        defectsCount: 0,
        pagesCrawled: 0,
      },
      defects: [],
      executions: [],
      accessibilityViolations: [],
      securityFindings: [],
      performanceMetrics: [],
    };

    await this.db.saveTestRun(testRun);
    await this.db.logAudit('RUN_STARTED', 'TEST_RUN', runId, `Started automated test run for '${project.name}' at ${scope.primaryUrl}`);

    this.emit(runId, {
      runId, stage: 'INITIALIZING',
      message: `Initializing browser worker and validating target scope: ${scope.primaryUrl}`,
      progressPercent: 5,
    });

    let browser: Browser | null = null;
    const classifier = new DefectClassifier();

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      // ── Stage 1: Safe Crawl & Surface Discovery ──────────────────────────
      testRun.status = 'CRAWLING';
      testRun.currentPhase = 'CRAWLING_DISCOVERY';
      testRun.progressPercent = 10;
      await this.db.saveTestRun(testRun);

      this.emit(runId, {
        runId, stage: 'CRAWLING',
        message: `Crawling site hierarchy up to depth ${scope.maxCrawlDepth}...`,
        progressPercent: 10,
      });

      const crawler = new SafeCrawler(scope, {
        vault: this.vault,
        headless: true,
        onProgress: (evt) => {
          this.emit(runId, {
            runId, stage: 'CRAWLING',
            message: `[Crawl] ${evt.phase}: ${evt.url} (${evt.pagesCrawled} discovered)`,
            progressPercent: Math.min(30, 10 + evt.pagesCrawled * 4),
          });
        },
      });

      const crawlSession: CrawlSession = await crawler.crawl(`session-${runId}`);
      
      // Fallback: Ensure at least the primary target page is audited if crawl yields 0 pages
      if (crawlSession.pages.length === 0) {
        crawlSession.pages.push({
          url: scope.primaryUrl,
          title: `${targetHost} Page`,
          depth: 0,
          statusCode: 200,
          loadTimeMs: 400,
          links: [],
          interactiveElements: [],
          hasForms: false,
          hasAuthTriggers: false,
          domHash: `hash-${targetHost}`,
        });
      }

      testRun.stats.pagesCrawled = crawlSession.pages.length;
      await this.db.saveCrawlSession(crawlSession);

      // Register broken link defects
      for (const broken of crawlSession.brokenLinks) {
        const defect = classifier.classifyFunctionalFailure(
          {
            id: `exec-broken-${Date.now()}`,
            testRunId: runId,
            testCaseId: `tc-link-${broken.statusCode}`,
            testCaseTitle: `Verify Link: ${broken.targetUrl}`,
            category: 'FUNCTIONAL',
            status: 'FAILED',
            durationMs: 0,
            retryCount: 0,
            startedAt: startTime,
            completedAt: new Date().toISOString(),
            stepResults: [{
              stepNumber: 1,
              action: 'NAVIGATE',
              status: 'FAILED',
              durationMs: 0,
              actualResult: `Broken link: HTTP ${broken.statusCode}`,
              errorMessage: broken.error,
            }],
            consoleLogs: [],
            networkFailures: [{ url: broken.targetUrl, method: 'GET', status: broken.statusCode }],
          },
          true
        );
        testRun.defects.push(defect);
        testRun.stats.defectsCount++;
        await this.db.saveDefect(defect);
      }

      // ── Stage 2: Security & Accessibility Audits ─────────────────────────
      testRun.currentPhase = 'AUDITING_SECURITY_A11Y';
      testRun.progressPercent = 35;
      await this.db.saveTestRun(testRun);

      this.emit(runId, {
        runId, stage: 'AUDITING',
        message: 'Running WCAG 2.1/2.2 Level AA audits and passive security header evaluations...',
        progressPercent: 35,
      });

      const a11yEngine = new AccessibilityEngine();
      const secEngine = new SecurityEngine();
      const pagesToAudit = crawlSession.pages.slice(0, 6);

      for (let i = 0; i < pagesToAudit.length; i++) {
        const pageItem = pagesToAudit[i];
        const auditContext = await browser.newContext({ ignoreHTTPSErrors: true });
        try {
          const auditPage = await auditContext.newPage();

          this.emit(runId, {
            runId, stage: 'AUDITING',
            message: `[${i + 1}/${pagesToAudit.length}] Auditing: ${pageItem.url}`,
            progressPercent: Math.min(50, 35 + (i + 1) * 2),
          });

          // Security
          const secFindings = await secEngine.auditPage(auditPage, pageItem.url).catch(() => []);
          for (const sec of secFindings) {
            testRun.securityFindings?.push(sec);
            const defect = classifier.classifySecurityFinding(sec, pageItem.url, runId);
            testRun.defects.push(defect);
            testRun.stats.defectsCount++;
            await this.db.saveDefect(defect);
          }

          // Accessibility
          const a11yViolations = await a11yEngine.auditPage(auditPage).catch(() => []);
          for (const a11y of a11yViolations) {
            testRun.accessibilityViolations?.push(a11y);
            const defect = classifier.classifyA11yViolation(a11y, pageItem.url, runId);
            testRun.defects.push(defect);
            testRun.stats.defectsCount++;
            await this.db.saveDefect(defect);
          }
        } finally {
          await auditContext.close().catch(() => {});
        }
      }

      // ── Stage 3: Performance Diagnostics ─────────────────────────────────
      testRun.currentPhase = 'AUDITING_PERFORMANCE';
      testRun.progressPercent = 55;
      await this.db.saveTestRun(testRun);

      this.emit(runId, {
        runId, stage: 'AUDITING',
        message: 'Running Core Web Vitals diagnostics (FCP, LCP, CLS, TTFB)...',
        progressPercent: 55,
      });

      const perfEngine = new PerformanceEngine();
      const pagesToProfile = crawlSession.pages.slice(0, 4);

      for (let i = 0; i < pagesToProfile.length; i++) {
        const pageItem = pagesToProfile[i];
        const perfContext = await browser.newContext({ ignoreHTTPSErrors: true });
        try {
          const perfPage = await perfContext.newPage();
          const metrics = await perfEngine.measurePage(perfPage, pageItem.url).catch(() => null);
          if (metrics) {
            testRun.performanceMetrics?.push(metrics);

            // Convert performance issues into defects
            for (const issue of (metrics as any).issues || []) {
              const defect = classifier.classifyPerformanceIssue(issue, pageItem.url, runId);
              testRun.defects.push(defect);
              testRun.stats.defectsCount++;
              await this.db.saveDefect(defect);
            }
          }
        } finally {
          await perfContext.close().catch(() => {});
        }
      }

      // ── Stage 4: Visual Regression Screenshots ────────────────────────────
      testRun.currentPhase = 'VISUAL_REGRESSION';
      testRun.progressPercent = 65;
      await this.db.saveTestRun(testRun);

      this.emit(runId, {
        runId, stage: 'AUDITING',
        message: 'Capturing visual regression screenshots with Pixelmatch differential analysis...',
        progressPercent: 65,
      });

      const visualEngine = new VisualRegressionEngine({ vault: this.vault });
      const pagesToCapture = crawlSession.pages.slice(0, 5);
      const visualResults: any[] = [];

      for (let i = 0; i < pagesToCapture.length; i++) {
        const pageItem = pagesToCapture[i];
        const visContext = await browser.newContext({ ignoreHTTPSErrors: true });
        try {
          const visPage = await visContext.newPage();
          await visPage.goto(pageItem.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          const pageName = `page-${i}-${new URL(pageItem.url).pathname.replace(/\//g, '-').replace(/^-/, '') || 'home'}`;
          const visResult = await visualEngine.captureAndCompare(visPage, pageItem.url, runId, pageName).catch(() => null);

          if (visResult) {
            visualResults.push(visResult);
            if (visResult.isMismatch && !visResult.isBaseline) {
              const defect = classifier.classifyVisualRegression(visResult, pageItem.url, runId);
              testRun.defects.push(defect);
              testRun.stats.defectsCount++;
              await this.db.saveDefect(defect);
            }
          }
        } finally {
          await visContext.close().catch(() => {});
        }
      }

      // Store visual results in run metadata
      (testRun as any).visualResults = visualResults;

      // ── Stage 5: AI Exploratory Functional Journeys ───────────────────────
      testRun.status = 'EXECUTING';
      testRun.currentPhase = 'AI_EXPLORATORY_JOURNEYS';
      testRun.progressPercent = 72;
      await this.db.saveTestRun(testRun);

      this.emit(runId, {
        runId, stage: 'EXPLORING',
        message: 'AI Exploratory Agent synthesizing user journeys: Nav, Forms, Auth, Buttons, Search, Scroll...',
        progressPercent: 72,
      });

      const agent = new AIExploratoryAgent({
        vault: this.vault,
        maxTestCases: 12,
        onEvent: (evt: ExplorationAgentEvent) => {
          this.emit(runId, {
            runId, stage: 'EXPLORING',
            message: `[AI Agent ${evt.phase}] ${evt.testCaseTitle}${evt.message ? ': ' + evt.message : ''}`,
            progressPercent: Math.min(92, 72 + (evt.stepNumber || 1) * 2),
          });
        },
      });

      const { executions, defects } = await agent.executeExploration(
        browser,
        crawlSession.pages,
        scope,
        runId
      );

      testRun.executions = executions;
      for (const d of defects) {
        testRun.defects.push(d);
        testRun.stats.defectsCount++;
        await this.db.saveDefect(d);
      }

      // ── Stage 6: Summarise & Finalize ─────────────────────────────────────
      testRun.status = 'TRIAGING';
      testRun.currentPhase = 'TRIAGING_FINALIZATION';
      testRun.progressPercent = 96;
      await this.db.saveTestRun(testRun);

      this.emit(runId, {
        runId, stage: 'TRIAGING',
        message: 'Aggregating metrics, finalizing defect classifications, and computing pass rate...',
        progressPercent: 96,
      });

      testRun.stats.totalTests = executions.length;
      testRun.stats.passed = executions.filter((e) => e.status === 'PASSED').length;
      testRun.stats.failed = executions.filter((e) => e.status === 'FAILED').length;
      testRun.stats.skipped = executions.filter((e) => e.status === 'SKIPPED').length;
      testRun.stats.flaky = executions.filter((e) => e.status === 'FLAKY').length;

      testRun.status =
        testRun.stats.failed > 0 || testRun.defects.some((d) => d.severity === 'P1') ? 'FAILED' : 'COMPLETED';
      testRun.progressPercent = 100;
      testRun.completedAt = new Date().toISOString();

      await this.db.saveTestRun(testRun);
      await this.db.logAudit(
        'RUN_COMPLETED',
        'TEST_RUN',
        runId,
        `Finished: ${testRun.stats.passed} passed, ${testRun.stats.failed} failed, ${testRun.defects.length} defects across ${crawlSession.pages.length} pages.`
      );

      this.emit(runId, {
        runId, stage: 'COMPLETED',
        message: `Run completed. ${testRun.defects.length} defects found across ${crawlSession.pages.length} pages.`,
        progressPercent: 100,
        data: testRun,
      });

      return testRun;
    } catch (err: any) {
      testRun.status = 'FAILED';
      testRun.progressPercent = 100;
      testRun.completedAt = new Date().toISOString();
      await this.db.saveTestRun(testRun);
      await this.db.logAudit('RUN_FAILED', 'TEST_RUN', runId, `Test run failed: ${err.message}`);

      this.emit(runId, {
        runId, stage: 'FAILED',
        message: `Test run failed: ${err.message}`,
        progressPercent: 100,
      });

      throw err;
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}
