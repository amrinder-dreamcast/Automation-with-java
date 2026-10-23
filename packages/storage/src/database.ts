import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Project, TestRun, Defect, CrawlSession, DesignComparisonResult } from '@testpilot/core';

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
  designComparisons?: DesignComparisonResult[];
}

export class TestPilotDatabase {
  private filePath: string;
  private state: DatabaseState | null = null;
  private writeLock: Promise<void> = Promise.resolve();

  constructor(filePath?: string) {
    this.filePath = filePath || process.env.TESTPILOT_DB_PATH || path.resolve(process.cwd(), 'data', 'testpilot-db.json');
  }

  private async ensureLoaded(): Promise<DatabaseState> {
    if (this.state) return this.state;

    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      this.state = JSON.parse(content) as DatabaseState;
    } catch {
      // Initialize with default state & benchmark demo data
      this.state = this.getInitialSeedState();
      await this.persist();
    }
    return this.state;
  }

  private getInitialSeedState(): DatabaseState {
    return {
      version: 1,
      projects: [],
      testRuns: [],
      defects: [],
      crawlSessions: [],
      auditLogs: [],
      designComparisons: [],
    };
  }

  /**
   * Resets all stored data: projects, test runs, defects, crawl sessions, and audit logs.
   */
  public async resetAllData(): Promise<void> {
    this.state = this.getInitialSeedState();
    await this.persist();
  }

  // --- Crawl Session Operations ---
  public async getCrawlSessions(projectId?: string): Promise<CrawlSession[]> {
    const state = await this.ensureLoaded();
    if (projectId) {
      return state.crawlSessions.filter((c) => c.projectId === projectId);
    }
    return state.crawlSessions;
  }

  public async saveCrawlSession(session: CrawlSession): Promise<CrawlSession> {
    const state = await this.ensureLoaded();
    const idx = state.crawlSessions.findIndex((c) => c.id === session.id);
    if (idx >= 0) {
      state.crawlSessions[idx] = session;
    } else {
      state.crawlSessions.unshift(session);
    }
    await this.persist();
    return session;
  }

  private async persist(): Promise<void> {
    if (!this.state) return;
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    // Atomic write pattern: write to tmp file then rename
    const tmpFile = `${this.filePath}.${Date.now()}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(this.state, null, 2), 'utf-8');
    await fs.rename(tmpFile, this.filePath);
  }

  // --- Project Operations ---
  public async getProjects(): Promise<Project[]> {
    const state = await this.ensureLoaded();
    return state.projects;
  }

  public async getProjectById(id: string): Promise<Project | null> {
    const state = await this.ensureLoaded();
    return state.projects.find((p) => p.id === id) || null;
  }

  public async saveProject(project: Project): Promise<Project> {
    const state = await this.ensureLoaded();
    const idx = state.projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      state.projects[idx] = project;
    } else {
      state.projects.unshift(project);
    }
    await this.persist();
    return project;
  }

  // --- Test Run Operations ---
  public async getTestRuns(projectId?: string): Promise<TestRun[]> {
    const state = await this.ensureLoaded();
    if (projectId) {
      return state.testRuns.filter((r) => r.projectId === projectId);
    }
    return state.testRuns;
  }

  public async getTestRunById(id: string): Promise<TestRun | null> {
    const state = await this.ensureLoaded();
    return state.testRuns.find((r) => r.id === id) || null;
  }

  public async saveTestRun(run: TestRun): Promise<TestRun> {
    const state = await this.ensureLoaded();
    const idx = state.testRuns.findIndex((r) => r.id === run.id);
    if (idx >= 0) {
      state.testRuns[idx] = run;
    } else {
      state.testRuns.unshift(run);
    }
    await this.persist();
    return run;
  }

  // --- Defect Operations ---
  public async getDefects(testRunId?: string, projectId?: string): Promise<Defect[]> {
    const state = await this.ensureLoaded();
    let results = state.defects;
    if (testRunId) {
      results = results.filter((d) => d.testRunId === testRunId);
    }
    return results;
  }

  public async getDefectById(id: string): Promise<Defect | null> {
    const state = await this.ensureLoaded();
    return state.defects.find((d) => d.id === id) || null;
  }

  public async saveDefect(defect: Defect): Promise<Defect> {
    const state = await this.ensureLoaded();
    // Check deduplication fingerprint
    const existing = state.defects.find((d) => d.fingerprint === defect.fingerprint);
    if (existing) {
      existing.lastSeenAt = defect.lastSeenAt;
      existing.evidence.push(...defect.evidence);
      await this.persist();
      return existing;
    }

    state.defects.unshift(defect);
    await this.persist();
    return defect;
  }

  public async updateDefectStatus(id: string, status: Defect['status']): Promise<Defect | null> {
    const state = await this.ensureLoaded();
    const defect = state.defects.find((d) => d.id === id);
    if (defect) {
      defect.status = status;
      await this.persist();
      return defect;
    }
    return null;
  }

  // --- Audit Logs ---
  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    const state = await this.ensureLoaded();
    return state.auditLogs;
  }

  public async logAudit(action: string, entityType: AuditLogEntry['entityType'], entityId: string, details: string): Promise<void> {
    const state = await this.ensureLoaded();
    state.auditLogs.unshift({
      id: `audit-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      details,
    });
    // Keep max 200 audit entries
    if (state.auditLogs.length > 200) {
      state.auditLogs = state.auditLogs.slice(0, 200);
    }
    await this.persist();
  }

  // --- Design Comparison Operations ---
  public async getDesignComparisons(): Promise<DesignComparisonResult[]> {
    const state = await this.ensureLoaded();
    if (!state.designComparisons) state.designComparisons = [];
    return state.designComparisons;
  }

  public async getDesignComparisonById(id: string): Promise<DesignComparisonResult | null> {
    const state = await this.ensureLoaded();
    if (!state.designComparisons) state.designComparisons = [];
    return state.designComparisons.find((c) => c.id === id) || null;
  }

  public async saveDesignComparison(comparison: DesignComparisonResult): Promise<DesignComparisonResult> {
    const state = await this.ensureLoaded();
    if (!state.designComparisons) state.designComparisons = [];
    const idx = state.designComparisons.findIndex((c) => c.id === comparison.id);
    if (idx >= 0) {
      state.designComparisons[idx] = comparison;
    } else {
      state.designComparisons.unshift(comparison);
    }
    await this.persist();
    return comparison;
  }

  public async deleteDesignComparison(id: string): Promise<boolean> {
    const state = await this.ensureLoaded();
    if (!state.designComparisons) return false;
    const initialLen = state.designComparisons.length;
    state.designComparisons = state.designComparisons.filter((c) => c.id !== id);
    if (state.designComparisons.length !== initialLen) {
      await this.persist();
      return true;
    }
    return false;
  }
}
