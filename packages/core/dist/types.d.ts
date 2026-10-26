/**
 * TestPilot AI - Core Domain Types
 */
export type Severity = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type DefectClassification = 'CONFIRMED' | 'PROBABLE' | 'FLAKY' | 'INFRASTRUCTURE' | 'CONFIGURATION' | 'NEEDS_VERIFICATION';
export type DefectCategory = 'FUNCTIONAL' | 'VISUAL' | 'ACCESSIBILITY' | 'PERFORMANCE' | 'SECURITY' | 'API';
export type RunStatus = 'PENDING' | 'CRAWLING' | 'PLANNING' | 'EXECUTING' | 'TRIAGING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type TestResultStatus = 'PASSED' | 'FAILED' | 'SKIPPED' | 'FLAKY';
export interface TargetScope {
    id: string;
    projectId: string;
    primaryUrl: string;
    allowedDomains: string[];
    allowSubdomains: boolean;
    allowExternalLinks: boolean;
    maxCrawlDepth: number;
    maxPages: number;
    crawlTimeoutMs: number;
    allowLocalTargets?: boolean;
}
export interface InteractiveElement {
    id: string;
    pageUrl: string;
    tagName: string;
    role: string | null;
    name: string | null;
    selector: string;
    xpath?: string;
    text?: string;
    isClickable: boolean;
    isInput: boolean;
    inputType?: string;
    formId?: string;
    location?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export interface DiscoveredPage {
    url: string;
    title: string;
    depth: number;
    statusCode: number;
    loadTimeMs: number;
    links: string[];
    interactiveElements: InteractiveElement[];
    hasForms: boolean;
    hasAuthTriggers: boolean;
    screenshotUrl?: string;
    domHash?: string;
}
export interface CrawlSession {
    id: string;
    projectId: string;
    targetUrl: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    startedAt: string;
    completedAt?: string;
    pages: DiscoveredPage[];
    brokenLinks: Array<{
        sourceUrl: string;
        targetUrl: string;
        statusCode: number;
        error?: string;
    }>;
    errors: string[];
}
export interface TestStep {
    stepNumber: number;
    action: 'NAVIGATE' | 'CLICK' | 'TYPE' | 'SELECT' | 'ASSERT_VISIBLE' | 'ASSERT_TEXT' | 'ASSERT_STATUS' | 'WAIT';
    targetSelector?: string;
    targetValue?: string;
    expectedOutcome: string;
    description: string;
}
export interface TestCase {
    id: string;
    suiteId?: string;
    title: string;
    objective: string;
    category: DefectCategory;
    preconditions: string[];
    steps: TestStep[];
    expectedResult: string;
    isAiGenerated: boolean;
    targetUrl: string;
}
export interface TestStepResult {
    stepNumber: number;
    action: string;
    status: 'PASSED' | 'FAILED' | 'SKIPPED';
    durationMs: number;
    actualResult: string;
    errorMessage?: string;
    screenshotPath?: string;
}
export interface TestExecution {
    id: string;
    testRunId: string;
    testCaseId: string;
    testCaseTitle: string;
    category: DefectCategory;
    status: TestResultStatus;
    durationMs: number;
    retryCount: number;
    startedAt: string;
    completedAt: string;
    stepResults: TestStepResult[];
    consoleLogs: Array<{
        type: string;
        text: string;
        location?: string;
    }>;
    networkFailures: Array<{
        url: string;
        method: string;
        status: number;
        errorText?: string;
    }>;
    tracePath?: string;
    screenshotPath?: string;
}
export interface DefectEvidence {
    id: string;
    defectId: string;
    type: 'SCREENSHOT' | 'VISUAL_DIFF' | 'CONSOLE_LOG' | 'NETWORK_HAR' | 'DOM_SNAPSHOT';
    artifactPath: string;
    caption: string;
    metadata?: Record<string, unknown>;
}
export interface Defect {
    id: string;
    testRunId: string;
    title: string;
    summary: string;
    category: DefectCategory;
    severity: Severity;
    classification: DefectClassification;
    confidenceScore: number;
    affectedUrl: string;
    browser: string;
    reproductionStatus: 'REPRODUCIBLE' | 'INTERMITTENT' | 'UNREPRODUCED';
    reproductionSteps: string[];
    expectedBehavior: string;
    actualBehavior: string;
    rootCauseAnalysis: string;
    likelyCauseExplanation: string;
    suggestedFix: string;
    regressionTestCode?: string;
    fingerprint: string;
    evidence: DefectEvidence[];
    firstSeenAt: string;
    lastSeenAt: string;
    status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'IGNORED';
}
export interface PerformanceMetrics {
    url: string;
    navigationDurationMs: number;
    domContentLoadedMs: number;
    ttfbMs: number;
    largestContentfulPaintMs?: number;
    cumulativeLayoutShift?: number;
    totalRequests: number;
    failedRequests: number;
    totalBytesTransferred: number;
    slowRequests: Array<{
        url: string;
        durationMs: number;
    }>;
}
export interface AccessibilityViolationNode {
    html: string;
    target: string[];
    failureSummary: string;
}
export interface AccessibilityViolation {
    id: string;
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
    description: string;
    help: string;
    helpUrl: string;
    tags: string[];
    nodes: AccessibilityViolationNode[];
}
export interface SecurityFinding {
    type: 'MISSING_CSP' | 'INSECURE_COOKIE' | 'MIXED_CONTENT' | 'EXPOSED_ERROR' | 'MISSING_HSTS' | 'X_FRAME_OPTIONS_MISSING' | 'SENSITIVE_DATA_EXPOSURE';
    severity: Severity;
    title: string;
    description: string;
    evidence: string;
    recommendation: string;
}
export interface VisualDiffResult {
    baselinePath: string;
    candidatePath: string;
    diffPath?: string;
    diffPixelCount: number;
    totalPixels: number;
    mismatchPercentage: number;
    isMismatch: boolean;
}
export interface TestRun {
    id: string;
    projectId: string;
    status: RunStatus;
    primaryUrl: string;
    startedAt: string;
    completedAt?: string;
    progressPercent: number;
    currentPhase: string;
    stats: {
        totalTests: number;
        passed: number;
        failed: number;
        flaky: number;
        skipped: number;
        defectsCount: number;
        pagesCrawled: number;
    };
    defects: Defect[];
    executions: TestExecution[];
    performanceMetrics?: PerformanceMetrics[];
    accessibilityViolations?: AccessibilityViolation[];
    securityFindings?: SecurityFinding[];
}
export interface Project {
    id: string;
    name: string;
    description?: string;
    primaryUrl: string;
    createdAt: string;
    updatedAt: string;
    scope: TargetScope;
}
export type DesignSourceType = 'FIGMA_FILE' | 'FIGMA_URL' | 'AI_FILE' | 'ADOBE_XD_FILE' | 'ADOBE_XD_URL' | 'PHOTOSHOP_FILE' | 'IMAGE_UPLOAD' | 'BENCHMARK_PRESET';
export type DesignUiIssueCategory = 'LAYOUT_ALIGNMENT' | 'COLOR_THEME' | 'TYPOGRAPHY' | 'SPACING_PADDING' | 'MISSING_ELEMENT' | 'EXTRA_ELEMENT' | 'VISUAL_PIXEL_DRIFT';
export interface DesignUiIssue {
    id: string;
    category: DesignUiIssueCategory;
    severity: Severity;
    title: string;
    description: string;
    expectedDesign: string;
    actualImplementation: string;
    selector?: string;
    suggestedCssFix?: string;
    diffScore?: number;
    boundingRect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export interface DesignComparisonResult {
    id: string;
    targetUrl: string;
    sourceType: DesignSourceType;
    fileName?: string;
    figmaUrl?: string;
    presetId?: string;
    viewport: {
        width: number;
        height: number;
        name?: string;
    };
    designSnapshotPath: string;
    liveSnapshotPath: string;
    diffOverlayPath?: string;
    fidelityScore: number;
    mismatchPercentage: number;
    diffPixelCount: number;
    totalPixels: number;
    issues: DesignUiIssue[];
    metrics: {
        colorAccuracyPercent: number;
        typographyAccuracyPercent: number;
        layoutAccuracyPercent: number;
        missingElementsCount: number;
    };
    summary: string;
    timestamp: string;
}
//# sourceMappingURL=types.d.ts.map