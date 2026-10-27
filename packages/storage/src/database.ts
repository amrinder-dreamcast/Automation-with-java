import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
    if (filePath) {
      this.filePath = filePath;
    } else if (process.env.TESTPILOT_DB_PATH) {
      this.filePath = process.env.TESTPILOT_DB_PATH;
    } else {
      // Intelligently find existing database in current or parent repo directory
      const cwdCandidate = path.resolve(process.cwd(), 'data', 'testpilot-db.json');
      const parentCandidate = path.resolve(process.cwd(), '..', '..', 'data', 'testpilot-db.json');
      const singleParentCandidate = path.resolve(process.cwd(), '..', 'data', 'testpilot-db.json');

      if (existsSync(cwdCandidate)) {
        this.filePath = cwdCandidate;
      } else if (existsSync(parentCandidate)) {
        this.filePath = parentCandidate;
      } else if (existsSync(singleParentCandidate)) {
        this.filePath = singleParentCandidate;
      } else {
        this.filePath = cwdCandidate;
      }
    }
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

    // Synchronize and clean other possible database file paths
    const alternatePaths = [
      path.resolve(process.cwd(), 'data', 'testpilot-db.json'),
      path.resolve(process.cwd(), '..', '..', 'data', 'testpilot-db.json'),
      path.resolve(process.cwd(), 'packages', 'web', 'data', 'testpilot-db.json'),
    ];
    for (const altPath of alternatePaths) {
      if (altPath !== this.filePath && existsSync(altPath)) {
        try {
          await fs.writeFile(altPath, JSON.stringify(this.getInitialSeedState(), null, 2), 'utf-8');
        } catch {
          // ignore cleanup errors on secondary paths
        }
      }
    }
  }

  /**
   * Deletes a specific URL and all its associated findings, crawl pages, test runs, and defects.
   */
  public async deleteUrlData(targetUrl: string): Promise<{ deletedRuns: number; deletedDefects: number; deletedPages: number }> {
    const state = await this.ensureLoaded();
    const norm = (u?: string) => (u || '').trim().replace(/\/$/, '').toLowerCase();
    const targetNorm = norm(targetUrl);
    if (!targetNorm) return { deletedRuns: 0, deletedDefects: 0, deletedPages: 0 };

    let deletedRuns = 0;
    let deletedDefects = 0;
    let deletedPages = 0;

    // 1. Identify and remove matching test runs
    const removedRunIds = new Set<string>();
    state.testRuns = state.testRuns.filter((run) => {
      const prim = norm(run.primaryUrl || (run as any).scope?.primaryUrl);
      if (prim === targetNorm) {
        removedRunIds.add(run.id);
        deletedRuns++;
        return false;
      }
      return true;
    });

    // 2. Remove matching defects
    state.defects = state.defects.filter((d) => {
      const aff = norm(d.affectedUrl);
      if (aff === targetNorm || (d.testRunId && removedRunIds.has(d.testRunId))) {
        deletedDefects++;
        return false;
      }
      return true;
    });

    // 3. Remove from crawl sessions
    state.crawlSessions = state.crawlSessions.filter((session) => {
      const sessionPrim = norm((session as any).primaryUrl || (session as any).startUrl);
      if (sessionPrim === targetNorm) {
        deletedPages += (session.pages || []).length;
        return false;
      }
      // If target matches a subpage inside this session
      const originalPageCount = (session.pages || []).length;
      session.pages = (session.pages || []).filter((p) => norm(p.url) !== targetNorm);
      deletedPages += originalPageCount - session.pages.length;
      return true;
    });

    // 4. Remove project if primaryUrl matches
    state.projects = state.projects.filter((proj) => norm(proj.primaryUrl) !== targetNorm);

    // 5. Add audit log
    state.auditLogs.unshift({
      id: `audit-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      action: 'URL_DATA_DELETED',
      entityType: 'SYSTEM',
      entityId: targetUrl,
      details: `Purged URL ${targetUrl} (${deletedRuns} runs, ${deletedDefects} defects, ${deletedPages} pages removed)`,
    });
    if (state.auditLogs.length > 200) {
      state.auditLogs = state.auditLogs.slice(0, 200);
    }

    await this.persist();
    return { deletedRuns, deletedDefects, deletedPages };
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
