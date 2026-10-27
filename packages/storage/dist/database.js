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
exports.TestPilotDatabase = void 0;
const fs = __importStar(require("node:fs/promises"));
const node_fs_1 = require("node:fs");
const path = __importStar(require("node:path"));
class TestPilotDatabase {
    filePath;
    state = null;
    writeLock = Promise.resolve();
    constructor(filePath) {
        if (filePath) {
            this.filePath = filePath;
        }
        else if (process.env.TESTPILOT_DB_PATH) {
            this.filePath = process.env.TESTPILOT_DB_PATH;
        }
        else {
            // Intelligently find existing database in current or parent repo directory
            const cwdCandidate = path.resolve(process.cwd(), 'data', 'testpilot-db.json');
            const parentCandidate = path.resolve(process.cwd(), '..', '..', 'data', 'testpilot-db.json');
            const singleParentCandidate = path.resolve(process.cwd(), '..', 'data', 'testpilot-db.json');
            if ((0, node_fs_1.existsSync)(cwdCandidate)) {
                this.filePath = cwdCandidate;
            }
            else if ((0, node_fs_1.existsSync)(parentCandidate)) {
                this.filePath = parentCandidate;
            }
            else if ((0, node_fs_1.existsSync)(singleParentCandidate)) {
                this.filePath = singleParentCandidate;
            }
            else {
                this.filePath = cwdCandidate;
            }
        }
    }
    async ensureLoaded() {
        if (this.state)
            return this.state;
        try {
            const content = await fs.readFile(this.filePath, 'utf-8');
            this.state = JSON.parse(content);
        }
        catch {
            // Initialize with default state & benchmark demo data
            this.state = this.getInitialSeedState();
            await this.persist();
        }
        return this.state;
    }
    getInitialSeedState() {
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
    async resetAllData() {
        this.state = this.getInitialSeedState();
        await this.persist();
        // Synchronize and clean other possible database file paths
        const alternatePaths = [
            path.resolve(process.cwd(), 'data', 'testpilot-db.json'),
            path.resolve(process.cwd(), '..', '..', 'data', 'testpilot-db.json'),
            path.resolve(process.cwd(), 'packages', 'web', 'data', 'testpilot-db.json'),
        ];
        for (const altPath of alternatePaths) {
            if (altPath !== this.filePath && (0, node_fs_1.existsSync)(altPath)) {
                try {
                    await fs.writeFile(altPath, JSON.stringify(this.getInitialSeedState(), null, 2), 'utf-8');
                }
                catch {
                    // ignore cleanup errors on secondary paths
                }
            }
        }
    }
    /**
     * Deletes a specific URL and all its associated findings, crawl pages, test runs, and defects.
     */
    async deleteUrlData(targetUrl) {
        const state = await this.ensureLoaded();
        const norm = (u) => (u || '').trim().replace(/\/$/, '').toLowerCase();
        const targetNorm = norm(targetUrl);
        if (!targetNorm)
            return { deletedRuns: 0, deletedDefects: 0, deletedPages: 0 };
        let deletedRuns = 0;
        let deletedDefects = 0;
        let deletedPages = 0;
        // 1. Identify and remove matching test runs
        const removedRunIds = new Set();
        state.testRuns = state.testRuns.filter((run) => {
            const prim = norm(run.primaryUrl || run.scope?.primaryUrl);
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
            const sessionPrim = norm(session.primaryUrl || session.startUrl);
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
    async getCrawlSessions(projectId) {
        const state = await this.ensureLoaded();
        if (projectId) {
            return state.crawlSessions.filter((c) => c.projectId === projectId);
        }
        return state.crawlSessions;
    }
    async saveCrawlSession(session) {
        const state = await this.ensureLoaded();
        const idx = state.crawlSessions.findIndex((c) => c.id === session.id);
        if (idx >= 0) {
            state.crawlSessions[idx] = session;
        }
        else {
            state.crawlSessions.unshift(session);
        }
        await this.persist();
        return session;
    }
    async persist() {
        if (!this.state)
            return;
        const dir = path.dirname(this.filePath);
        await fs.mkdir(dir, { recursive: true });
        // Atomic write pattern: write to tmp file then rename
        const tmpFile = `${this.filePath}.${Date.now()}.tmp`;
        await fs.writeFile(tmpFile, JSON.stringify(this.state, null, 2), 'utf-8');
        await fs.rename(tmpFile, this.filePath);
    }
    // --- Project Operations ---
    async getProjects() {
        const state = await this.ensureLoaded();
        return state.projects;
    }
    async getProjectById(id) {
        const state = await this.ensureLoaded();
        return state.projects.find((p) => p.id === id) || null;
    }
    async saveProject(project) {
        const state = await this.ensureLoaded();
        const idx = state.projects.findIndex((p) => p.id === project.id);
        if (idx >= 0) {
            state.projects[idx] = project;
        }
        else {
            state.projects.unshift(project);
        }
        await this.persist();
        return project;
    }
    // --- Test Run Operations ---
    async getTestRuns(projectId) {
        const state = await this.ensureLoaded();
        if (projectId) {
            return state.testRuns.filter((r) => r.projectId === projectId);
        }
        return state.testRuns;
    }
    async getTestRunById(id) {
        const state = await this.ensureLoaded();
        return state.testRuns.find((r) => r.id === id) || null;
    }
    async saveTestRun(run) {
        const state = await this.ensureLoaded();
        const idx = state.testRuns.findIndex((r) => r.id === run.id);
        if (idx >= 0) {
            state.testRuns[idx] = run;
        }
        else {
            state.testRuns.unshift(run);
        }
        await this.persist();
        return run;
    }
    // --- Defect Operations ---
    async getDefects(testRunId, projectId) {
        const state = await this.ensureLoaded();
        let results = state.defects;
        if (testRunId) {
            results = results.filter((d) => d.testRunId === testRunId);
        }
        return results;
    }
    async getDefectById(id) {
        const state = await this.ensureLoaded();
        return state.defects.find((d) => d.id === id) || null;
    }
    async saveDefect(defect) {
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
    async updateDefectStatus(id, status) {
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
    async getAuditLogs() {
        const state = await this.ensureLoaded();
        return state.auditLogs;
    }
    async logAudit(action, entityType, entityId, details) {
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
    async getDesignComparisons() {
        const state = await this.ensureLoaded();
        if (!state.designComparisons)
            state.designComparisons = [];
        return state.designComparisons;
    }
    async getDesignComparisonById(id) {
        const state = await this.ensureLoaded();
        if (!state.designComparisons)
            state.designComparisons = [];
        return state.designComparisons.find((c) => c.id === id) || null;
    }
    async saveDesignComparison(comparison) {
        const state = await this.ensureLoaded();
        if (!state.designComparisons)
            state.designComparisons = [];
        const idx = state.designComparisons.findIndex((c) => c.id === comparison.id);
        if (idx >= 0) {
            state.designComparisons[idx] = comparison;
        }
        else {
            state.designComparisons.unshift(comparison);
        }
        await this.persist();
        return comparison;
    }
    async deleteDesignComparison(id) {
        const state = await this.ensureLoaded();
        if (!state.designComparisons)
            return false;
        const initialLen = state.designComparisons.length;
        state.designComparisons = state.designComparisons.filter((c) => c.id !== id);
        if (state.designComparisons.length !== initialLen) {
            await this.persist();
            return true;
        }
        return false;
    }
}
exports.TestPilotDatabase = TestPilotDatabase;
//# sourceMappingURL=database.js.map