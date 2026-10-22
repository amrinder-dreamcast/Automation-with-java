import { Project, TestRun, Defect, CrawlSession } from '@testpilot/core';
export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    entityType: 'PROJECT' | 'TEST_RUN' | 'DEFECT' | 'SCOPE' | 'SYSTEM';
    entityId: string;
    details: string;
}
export interface DatabaseState {
    version: number;
    projects: Project[];
    testRuns: TestRun[];
    defects: Defect[];
    crawlSessions: CrawlSession[];
    auditLogs: AuditLogEntry[];
}
export declare class TestPilotDatabase {
    private filePath;
    private state;
    private writeLock;
    constructor(filePath?: string);
    private ensureLoaded;
    private getInitialSeedState;
    /**
     * Resets all stored data: projects, test runs, defects, crawl sessions, and audit logs.
     */
    resetAllData(): Promise<void>;
    getCrawlSessions(projectId?: string): Promise<CrawlSession[]>;
    saveCrawlSession(session: CrawlSession): Promise<CrawlSession>;
    private persist;
    getProjects(): Promise<Project[]>;
    getProjectById(id: string): Promise<Project | null>;
    saveProject(project: Project): Promise<Project>;
    getTestRuns(projectId?: string): Promise<TestRun[]>;
    getTestRunById(id: string): Promise<TestRun | null>;
    saveTestRun(run: TestRun): Promise<TestRun>;
    getDefects(testRunId?: string, projectId?: string): Promise<Defect[]>;
    getDefectById(id: string): Promise<Defect | null>;
    saveDefect(defect: Defect): Promise<Defect>;
    updateDefectStatus(id: string, status: Defect['status']): Promise<Defect | null>;
    getAuditLogs(): Promise<AuditLogEntry[]>;
    logAudit(action: string, entityType: AuditLogEntry['entityType'], entityId: string, details: string): Promise<void>;
}
//# sourceMappingURL=database.d.ts.map