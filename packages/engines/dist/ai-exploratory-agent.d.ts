import { Browser } from 'playwright';
import { DiscoveredPage, TestCase, TestExecution, Defect, TargetScope } from '@testpilot/core';
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
    maxTestCases?: number;
}
export declare class AIExploratoryAgent {
    private vault;
    private functionalEngine;
    private classifier;
    private reproducer;
    private onEvent?;
    private maxTestCases;
    constructor(options?: ExplorationAgentOptions);
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
    planTestCases(pages: DiscoveredPage[], scope: TargetScope): TestCase[];
    /**
     * Returns an appropriate test value for an input element based on its type/name.
     */
    private getValidTestValue;
    /**
     * Executes the full closed-loop exploratory testing cycle:
     * Observe → Understand → Plan → Execute → Verify → Record
     */
    executeExploration(browser: Browser, pages: DiscoveredPage[], scope: TargetScope, testRunId: string): Promise<{
        executions: TestExecution[];
        defects: Defect[];
    }>;
}
//# sourceMappingURL=ai-exploratory-agent.d.ts.map