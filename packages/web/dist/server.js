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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const http = __importStar(require("node:http"));
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const node_url_1 = require("node:url");
const storage_1 = require("@testpilot/storage");
const fixture_site_1 = require("@testpilot/fixture-site");
const engines_1 = require("@testpilot/engines");
const mcp_suite_1 = require("@testpilot/mcp-suite");
const runner_js_1 = require("./runner.js");
const exceljs_1 = __importDefault(require("exceljs"));
const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);
const FIXTURE_PORT = 4000;
async function startServer(customPort) {
    const PORT = customPort || DEFAULT_PORT;
    const db = new storage_1.TestPilotDatabase();
    const vault = new storage_1.ArtifactVault();
    const runner = new runner_js_1.TestPilotRunner(db, vault);
    const designComparator = new engines_1.DesignComparator({ vault });
    const activeSessions = new Map();
    const registeredUsers = new Map();
    const usersFilePath = path.resolve(process.cwd(), 'data', 'users.json');
    async function saveUsers() {
        try {
            const uniqueUsers = Array.from(new Set(registeredUsers.values()));
            await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
            await fs.writeFile(usersFilePath, JSON.stringify(uniqueUsers, null, 2), 'utf-8');
        }
        catch (e) {
            console.warn('[TestPilot Auth] Could not persist users:', e);
        }
    }
    async function loadUsers() {
        try {
            const data = await fs.readFile(usersFilePath, 'utf-8');
            const list = JSON.parse(data);
            for (const u of list) {
                registeredUsers.set(u.email.toLowerCase(), u);
                registeredUsers.set(u.username.toLowerCase(), u);
            }
        }
        catch {
            // Seed default admin account
            const defaultAdmin = {
                id: 'usr_admin',
                name: 'Admin User',
                email: 'admin@testpilot.ai',
                username: 'admin',
                password: 'pilotPass123!',
                role: 'Enterprise QA Lead',
                initials: 'AU',
                createdAt: new Date().toISOString(),
            };
            registeredUsers.set(defaultAdmin.email.toLowerCase(), defaultAdmin);
            registeredUsers.set(defaultAdmin.username.toLowerCase(), defaultAdmin);
            await saveUsers();
        }
    }
    await loadUsers();
    // Auto-boot benchmark fixture site on port 4000 for immediate out-of-the-box verification
    let fixtureServer;
    try {
        fixtureServer = (0, fixture_site_1.createFixtureServer)();
        fixtureServer.listen(FIXTURE_PORT, () => {
            console.log(`[TestPilot Fixture Site] Running on http://localhost:${FIXTURE_PORT}`);
        });
        fixtureServer.on('error', () => {
            console.log(`[TestPilot Fixture Site] Port ${FIXTURE_PORT} already in use or unavailable.`);
        });
    }
    catch (e) {
        console.log('[TestPilot Fixture Site] Could not start fixture server:', e);
    }
    const publicDir = path.resolve(__dirname, '..', 'public');
    const server = http.createServer(async (req, res) => {
        const parsedUrl = new node_url_1.URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;
        const method = req.method?.toUpperCase() || 'GET';
        // CORS Headers for API
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (method === 'OPTIONS') {
            res.writeHead(204);
            return res.end();
        }
        const sendJson = (status, data) => {
            res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(data));
        };
        const getBody = async () => {
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const raw = Buffer.concat(chunks).toString('utf-8');
            try {
                return raw ? JSON.parse(raw) : {};
            }
            catch {
                return {};
            }
        };
        // --- API Routes ---
        // 0. Authentication Routes
        if (pathname === '/api/auth/login' && method === 'POST') {
            const body = await getBody();
            const identifier = String(body.email || body.username || '').trim().toLowerCase();
            const password = String(body.password || '').trim();
            const rememberMe = Boolean(body.rememberMe);
            if (!identifier) {
                return sendJson(400, { error: 'Username or Email address is required' });
            }
            if (!password) {
                return sendJson(400, { error: 'Password is required' });
            }
            const existingUser = registeredUsers.get(identifier);
            if (!existingUser || existingUser.password !== password) {
                return sendJson(401, {
                    error: 'Invalid credentials. Please enter a valid email and password.',
                });
            }
            const user = {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                username: existingUser.username,
                role: existingUser.role,
                initials: existingUser.initials,
                loggedInAt: new Date().toISOString(),
            };
            const token = `tp_sess_${Math.random().toString(36).substring(2)}_${Date.now()}`;
            activeSessions.set(token, user);
            const maxAge = rememberMe ? 30 * 86400 : 86400;
            res.setHeader('Set-Cookie', `testpilot_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`);
            return sendJson(200, {
                success: true,
                token,
                user,
            });
        }
        if (pathname === '/api/auth/register' && method === 'POST') {
            const body = await getBody();
            const name = String(body.name || '').trim();
            const email = String(body.email || '').trim().toLowerCase();
            const password = String(body.password || '').trim();
            if (!name) {
                return sendJson(400, { error: 'Full name is required' });
            }
            if (!email || !email.includes('@')) {
                return sendJson(400, { error: 'A valid email address is required' });
            }
            if (!password || password.length < 4) {
                return sendJson(400, { error: 'Password must be at least 4 characters long' });
            }
            if (registeredUsers.has(email)) {
                return sendJson(409, { error: 'An account with this email address already exists. Please sign in.' });
            }
            const username = email.split('@')[0];
            const newUser = {
                id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString(36)}`,
                name: name,
                email: email,
                username: username,
                password: password,
                role: 'Quality Engineer',
                initials: name.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase() || 'QE',
                createdAt: new Date().toISOString(),
            };
            registeredUsers.set(email, newUser);
            registeredUsers.set(username.toLowerCase(), newUser);
            await saveUsers();
            const user = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                role: newUser.role,
                initials: newUser.initials,
                loggedInAt: new Date().toISOString(),
            };
            const token = `tp_sess_${Math.random().toString(36).substring(2)}_${Date.now()}`;
            activeSessions.set(token, user);
            res.setHeader('Set-Cookie', `testpilot_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
            return sendJson(201, {
                success: true,
                token,
                user,
            });
        }
        if (pathname === '/api/auth/forgot-password' && method === 'POST') {
            const body = await getBody();
            const email = String(body.email || '').trim().toLowerCase();
            if (!email || !email.includes('@')) {
                return sendJson(400, { error: 'Please provide a valid registered email address' });
            }
            if (!registeredUsers.has(email)) {
                return sendJson(404, { error: 'No account registered with this email address. Please sign up.' });
            }
            return sendJson(200, {
                success: true,
                message: `Recovery instructions have been dispatched to ${email}. Please check your inbox.`,
            });
        }
        if (pathname === '/api/auth/session' && method === 'GET') {
            const cookieHeader = req.headers.cookie || '';
            const match = cookieHeader.match(/testpilot_session=([^;]+)/);
            const authHeader = req.headers.authorization || '';
            const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
            const token = match ? match[1] : bearerToken;
            if (token && activeSessions.has(token)) {
                return sendJson(200, {
                    authenticated: true,
                    user: activeSessions.get(token),
                });
            }
            return sendJson(200, {
                authenticated: false,
                user: null,
            });
        }
        if (pathname === '/api/auth/logout' && method === 'POST') {
            const cookieHeader = req.headers.cookie || '';
            const match = cookieHeader.match(/testpilot_session=([^;]+)/);
            if (match && activeSessions.has(match[1])) {
                activeSessions.delete(match[1]);
            }
            res.setHeader('Set-Cookie', 'testpilot_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
            return sendJson(200, { success: true });
        }
        // 1. System Status
        if (pathname === '/api/status' && method === 'GET') {
            const projects = await db.getProjects();
            const testRuns = await db.getTestRuns();
            const defects = await db.getDefects();
            return sendJson(200, {
                status: 'ONLINE',
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                activeTarget: testRuns[0]?.primaryUrl || projects[0]?.primaryUrl || 'http://localhost:4000',
                stats: {
                    projectCount: projects.length,
                    testRunCount: testRuns.length,
                    defectCount: defects.length,
                    openP1Count: defects.filter((d) => d.severity === 'P1' && d.status === 'OPEN').length,
                    openP2Count: defects.filter((d) => d.severity === 'P2' && d.status === 'OPEN').length,
                },
            });
        }
        // 2. Projects
        if (pathname === '/api/projects' && method === 'GET') {
            const projects = await db.getProjects();
            return sendJson(200, projects);
        }
        if (pathname === '/api/projects' && method === 'POST') {
            const body = await getBody();
            if (!body.name || !body.primaryUrl) {
                return sendJson(400, { error: 'Missing name or primaryUrl' });
            }
            const projectId = `proj-${Date.now()}`;
            const newProj = {
                id: projectId,
                name: body.name,
                description: body.description || '',
                primaryUrl: body.primaryUrl,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                scope: {
                    id: `scope-${projectId}`,
                    projectId,
                    primaryUrl: body.primaryUrl,
                    allowedDomains: body.allowedDomains || [new node_url_1.URL(body.primaryUrl).hostname],
                    allowSubdomains: body.allowSubdomains ?? false,
                    allowExternalLinks: false,
                    maxCrawlDepth: body.maxCrawlDepth ?? 3,
                    maxPages: body.maxPages ?? 20,
                    crawlTimeoutMs: 25000,
                    allowLocalTargets: body.allowLocalTargets ?? true,
                },
            };
            await db.saveProject(newProj);
            await db.logAudit('PROJECT_CREATED', 'PROJECT', projectId, `Created project '${newProj.name}' targeting ${newProj.primaryUrl}`);
            return sendJson(201, newProj);
        }
        // 3. Test Runs List
        if (pathname === '/api/test-runs' && method === 'GET') {
            const projectId = parsedUrl.searchParams.get('projectId') || undefined;
            const runs = await db.getTestRuns(projectId);
            runs.forEach((r) => {
                const prim = r.primaryUrl || r.scope?.primaryUrl;
                if (r.defects && prim) {
                    r.defects.forEach((d) => {
                        if (!d.affectedUrl || d.affectedUrl === 'Target page') {
                            d.affectedUrl = prim;
                        }
                    });
                }
            });
            return sendJson(200, runs);
        }
        // 4. Test Run Detail
        if (pathname.startsWith('/api/test-runs/') && method === 'GET' && !pathname.endsWith('/events')) {
            const id = pathname.replace('/api/test-runs/', '');
            const run = await db.getTestRunById(id);
            if (!run)
                return sendJson(404, { error: 'Test run not found' });
            const prim = run.primaryUrl || run.scope?.primaryUrl;
            if (run.defects && prim) {
                run.defects.forEach((d) => {
                    if (!d.affectedUrl || d.affectedUrl === 'Target page') {
                        d.affectedUrl = prim;
                    }
                });
            }
            return sendJson(200, run);
        }
        // 5. Start Test Run
        if (pathname === '/api/test-runs/start' && method === 'POST') {
            const body = await getBody();
            const primaryUrl = body.scopeOverride?.primaryUrl || body.targetUrl || 'http://localhost:4000';
            let targetHost = 'localhost';
            try {
                targetHost = new node_url_1.URL(primaryUrl).hostname;
            }
            catch {
                return sendJson(400, { error: `Invalid target URL: '${primaryUrl}'` });
            }
            let project = body.projectId ? await db.getProjectById(body.projectId) : null;
            if (!project) {
                const projects = await db.getProjects();
                project = projects.find((p) => {
                    try {
                        return new node_url_1.URL(p.primaryUrl).hostname === targetHost;
                    }
                    catch {
                        return false;
                    }
                }) || projects[0] || null;
            }
            // Auto-create project if none exists
            if (!project) {
                const newProjId = `proj-${Date.now()}`;
                const isLocal = targetHost === 'localhost' || targetHost === '127.0.0.1';
                project = {
                    id: newProjId,
                    name: isLocal ? 'Local Benchmark Fixture' : `${targetHost.replace(/^www\./, '')} Suite`,
                    description: `Automated test project targeting ${primaryUrl}`,
                    primaryUrl,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    scope: {
                        id: `scope-${newProjId}`,
                        projectId: newProjId,
                        primaryUrl,
                        allowedDomains: [targetHost, targetHost.replace(/^www\./, '')],
                        allowSubdomains: true,
                        allowExternalLinks: false,
                        maxCrawlDepth: body.scopeOverride?.maxCrawlDepth ?? 3,
                        maxPages: body.scopeOverride?.maxPages ?? 20,
                        crawlTimeoutMs: 30000,
                        allowLocalTargets: isLocal,
                    },
                };
                await db.saveProject(project);
                await db.logAudit('PROJECT_CREATED', 'PROJECT', newProjId, `Auto-created project for target ${primaryUrl}`);
            }
            // Explicit deterministic runId
            const runId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            // Asynchronously trigger execution
            runner.executeTestCycle(project, body.scopeOverride, runId).catch((err) => {
                console.error('[TestPilot Runner Error]', err);
            });
            return sendJson(202, {
                message: 'Test run initiated',
                testRunId: runId,
            });
        }
        // 6. Real-time Events Stream (SSE)
        if (pathname.startsWith('/api/test-runs/') && pathname.endsWith('/events') && method === 'GET') {
            const runId = pathname.replace('/api/test-runs/', '').replace('/events', '');
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            });
            res.write(`data: ${JSON.stringify({ runId, stage: 'CONNECTED', message: 'SSE stream connected', progressPercent: 0 })}\n\n`);
            const unsubscribe = runner.subscribe(runId, (event) => {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
                if (event.stage === 'COMPLETED' || event.stage === 'FAILED') {
                    res.end();
                }
            });
            req.on('close', () => {
                unsubscribe();
            });
            return;
        }
        // 7. Defects
        if (pathname === '/api/defects' && method === 'GET') {
            const testRunId = parsedUrl.searchParams.get('testRunId') || undefined;
            const defects = await db.getDefects(testRunId);
            const runs = await db.getTestRuns();
            const runMap = new Map(runs.map((r) => [r.id, r.primaryUrl || r.scope?.primaryUrl]));
            defects.forEach((d) => {
                if ((!d.affectedUrl || d.affectedUrl === 'Target page') && d.testRunId && runMap.get(d.testRunId)) {
                    d.affectedUrl = runMap.get(d.testRunId);
                }
            });
            return sendJson(200, defects);
        }
        if (pathname.startsWith('/api/defects/') && method === 'PATCH') {
            const id = pathname.replace('/api/defects/', '');
            const body = await getBody();
            if (!body.status)
                return sendJson(400, { error: 'Missing status' });
            const updated = await db.updateDefectStatus(id, body.status);
            if (!updated)
                return sendJson(404, { error: 'Defect not found' });
            await db.logAudit('DEFECT_STATUS_UPDATED', 'DEFECT', id, `Updated defect status to '${body.status}'`);
            return sendJson(200, updated);
        }
        // 8. Audit Logs
        if (pathname === '/api/audit-logs' && method === 'GET') {
            const logs = await db.getAuditLogs();
            return sendJson(200, logs);
        }
        // 9. Crawl Sessions
        if (pathname === '/api/crawl-sessions' && method === 'GET') {
            const sessions = await db.getCrawlSessions();
            return sendJson(200, sessions);
        }
        // 10. Export Tested URLs Sheet API
        if ((pathname === '/api/export/sheet' || pathname === '/api/export/tested-urls') && method === 'GET') {
            const format = parsedUrl.searchParams.get('format') || 'json';
            const runs = await db.getTestRuns();
            const defects = await db.getDefects();
            const crawls = await db.getCrawlSessions();
            const norm = (u) => (u || '').trim().replace(/\/$/, '');
            const urlMap = new Map();
            runs.forEach((run) => {
                const prim = run.primaryUrl || run.scope?.primaryUrl;
                if (!prim)
                    return;
                const normPrim = norm(prim);
                if (!urlMap.has(normPrim)) {
                    urlMap.set(normPrim, {
                        url: normPrim,
                        isPrimary: true,
                        runs: [],
                        defects: [],
                        crawledPages: [],
                        firstTested: run.startedAt,
                        lastTested: run.startedAt,
                    });
                }
                urlMap.get(normPrim).runs.push(run);
            });
            crawls.forEach((session) => {
                const rootUrl = session.primaryUrl || session.startUrl ? norm(session.primaryUrl || session.startUrl) : null;
                const rootItem = rootUrl ? urlMap.get(rootUrl) : null;
                (session.pages || []).forEach((page) => {
                    if (!page.url)
                        return;
                    const normUrl = norm(page.url);
                    if (rootItem && !rootItem.crawledPages.some((p) => norm(p.url) === normUrl)) {
                        rootItem.crawledPages.push(page);
                    }
                    if (!urlMap.has(normUrl)) {
                        urlMap.set(normUrl, {
                            url: normUrl,
                            isPrimary: false,
                            runs: rootItem ? rootItem.runs : [],
                            defects: [],
                            crawledPages: [page],
                            firstTested: session.startedAt || new Date().toISOString(),
                            lastTested: session.completedAt || new Date().toISOString(),
                        });
                    }
                });
            });
            const allKnownPages = [];
            crawls.forEach((s) => {
                (s.pages || []).forEach((p) => {
                    if (p.url && !allKnownPages.some((kp) => norm(kp.url) === norm(p.url))) {
                        allKnownPages.push(p);
                    }
                });
            });
            allKnownPages.sort((a, b) => b.url.length - a.url.length);
            defects.forEach((defect) => {
                let matchedItem = null;
                const rawUrl = defect.affectedUrl || defect.pageUrl || '';
                const normRaw = norm(rawUrl);
                if (normRaw && urlMap.has(normRaw))
                    matchedItem = urlMap.get(normRaw);
                if (!matchedItem && allKnownPages.length > 0) {
                    const pm = allKnownPages.find((p) => norm(p.url) === normRaw);
                    if (pm && urlMap.has(norm(pm.url)))
                        matchedItem = urlMap.get(norm(pm.url));
                }
                if (!matchedItem && defect.title) {
                    for (const page of allKnownPages) {
                        try {
                            const path = new node_url_1.URL(page.url).pathname;
                            if (path.length > 1 && defect.title.includes(path) && urlMap.has(norm(page.url))) {
                                matchedItem = urlMap.get(norm(page.url));
                                break;
                            }
                        }
                        catch { }
                    }
                }
                if (!matchedItem && defect.testRunId) {
                    const run = runs.find((r) => r.id === defect.testRunId);
                    if (run) {
                        const prim = norm(run.primaryUrl || run.scope?.primaryUrl);
                        if (prim && urlMap.has(prim))
                            matchedItem = urlMap.get(prim);
                    }
                }
                if (matchedItem && !matchedItem.defects.some((d) => d.id === defect.id)) {
                    matchedItem.defects.push(defect);
                }
            });
            const items = Array.from(urlMap.values());
            const now = new Date().toISOString().replace(/[:.]/g, '-');
            if (format === 'csv') {
                const csvRows = [
                    ['Tested URL', 'Path / Route', 'Type', 'Overall Health', 'Test Runs', 'Defects Count', 'P1 Critical', 'P2 High', 'First Tested', 'Last Tested']
                        .map((h) => `"${h}"`).join(','),
                ];
                items.forEach((u) => {
                    const p1 = u.defects.filter((d) => d.severity === 'P1').length;
                    const p2 = u.defects.filter((d) => d.severity === 'P2').length;
                    let health = 'ALL_PASSED';
                    if (p1 > 0)
                        health = `CRITICAL (${p1} P1)`;
                    else if (p2 > 0)
                        health = `HIGH (${p2} P2)`;
                    else if (u.defects.length > 0)
                        health = `DEFECTS (${u.defects.length})`;
                    csvRows.push([
                        `"${u.url.replace(/"/g, '""')}"`,
                        `"${(u.url.replace(/^https?:\/\/[^/]+/, '') || '/').replace(/"/g, '""')}"`,
                        `"${u.isPrimary ? 'PRIMARY_TARGET' : 'DISCOVERED_PAGE'}"`,
                        `"${health}"`,
                        u.runs.length,
                        u.defects.length,
                        p1,
                        p2,
                        `"${u.firstTested || ''}"`,
                        `"${u.lastTested || ''}"`,
                    ].join(','));
                });
                const csvContent = '\uFEFF' + csvRows.join('\r\n');
                res.writeHead(200, {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="TestPilot_Tested_URLs_${now}.csv"`,
                });
                return res.end(csvContent);
            }
            if (format === 'excel' || format === 'xls' || format === 'xlsx') {
                const wb = new exceljs_1.default.Workbook();
                wb.creator = 'TestPilot AI Platform';
                wb.lastModifiedBy = 'TestPilot AI Platform';
                wb.created = new Date();
                wb.modified = new Date();
                const applyHeaderStyle = (ws) => {
                    ws.getRow(1).height = 26;
                    ws.getRow(1).eachCell((cell) => {
                        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
                        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FF334155' } },
                            bottom: { style: 'medium', color: { argb: 'FF0284C7' } },
                            left: { style: 'thin', color: { argb: 'FF334155' } },
                            right: { style: 'thin', color: { argb: 'FF334155' } },
                        };
                    });
                };
                // Sheet 1: Tested URLs Summary
                const wsUrls = wb.addWorksheet('Tested URLs Summary', {
                    views: [{ state: 'frozen', ySplit: 1 }]
                });
                wsUrls.columns = [
                    { header: 'Tested URL', key: 'url', width: 45 },
                    { header: 'Path / Route', key: 'path', width: 28 },
                    { header: 'Type', key: 'type', width: 18 },
                    { header: 'Overall Health', key: 'health', width: 22 },
                    { header: 'Test Runs', key: 'runs', width: 12 },
                    { header: 'Defects Total', key: 'defects', width: 14 },
                    { header: 'P1 Critical', key: 'p1', width: 12 },
                    { header: 'P2 High', key: 'p2', width: 12 },
                    { header: 'First Tested', key: 'first', width: 22 },
                    { header: 'Last Tested', key: 'last', width: 22 },
                ];
                applyHeaderStyle(wsUrls);
                items.forEach((u) => {
                    const p1 = u.defects.filter((d) => d.severity === 'P1').length;
                    const p2 = u.defects.filter((d) => d.severity === 'P2').length;
                    let health = 'ALL_PASSED';
                    if (p1 > 0)
                        health = `CRITICAL (${p1} P1)`;
                    else if (p2 > 0)
                        health = `HIGH (${p2} P2)`;
                    else if (u.defects.length > 0)
                        health = `DEFECTS (${u.defects.length})`;
                    const pathStr = (u.url.replace(/^https?:\/\/[^/]+/, '') || '/');
                    const row = wsUrls.addRow({
                        url: u.url,
                        path: pathStr,
                        type: u.isPrimary ? 'PRIMARY_TARGET' : 'DISCOVERED_PAGE',
                        health: health,
                        runs: u.runs.length,
                        defects: u.defects.length,
                        p1: p1,
                        p2: p2,
                        first: u.firstTested || '',
                        last: u.lastTested || '',
                    });
                    row.height = 20;
                    const cellUrl = row.getCell('url');
                    cellUrl.font = { name: 'Consolas', size: 9.5, color: { argb: 'FF0284C7' }, bold: true };
                    const cellHealth = row.getCell('health');
                    if (p1 > 0) {
                        cellHealth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                        cellHealth.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF991B1B' } };
                    }
                    else if (p2 > 0) {
                        cellHealth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
                        cellHealth.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF9A3412' } };
                    }
                    else if (u.defects.length > 0) {
                        cellHealth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
                        cellHealth.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF854D0E' } };
                    }
                    else {
                        cellHealth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
                        cellHealth.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };
                    }
                });
                wsUrls.autoFilter = { from: 'A1', to: 'J1' };
                // Sheet 2: Defects Aligned By URL
                const wsDefects = wb.addWorksheet('Defects Aligned By URL', {
                    views: [{ state: 'frozen', ySplit: 1 }]
                });
                wsDefects.columns = [
                    { header: 'Tested URL', key: 'url', width: 45 },
                    { header: 'Defect ID', key: 'id', width: 22 },
                    { header: 'Severity', key: 'severity', width: 12 },
                    { header: 'Category', key: 'category', width: 18 },
                    { header: 'Title', key: 'title', width: 35 },
                    { header: 'Root Cause', key: 'rootCause', width: 50 },
                    { header: 'Reproduction Steps', key: 'repro', width: 45 },
                    { header: 'Suggested Fix', key: 'fix', width: 50 },
                ];
                applyHeaderStyle(wsDefects);
                items.forEach((u) => {
                    u.defects.forEach((d) => {
                        const repro = Array.isArray(d.reproductionSteps) ? d.reproductionSteps.join(' -> ') : (d.reproductionSteps || '');
                        const row = wsDefects.addRow({
                            url: u.url,
                            id: d.id,
                            severity: d.severity,
                            category: d.category,
                            title: d.title,
                            rootCause: d.rootCauseAnalysis || d.likelyCauseExplanation || '',
                            repro: repro,
                            fix: d.suggestedFix || '',
                        });
                        row.height = 20;
                        const cellSev = row.getCell('severity');
                        if (d.severity === 'P1') {
                            cellSev.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                            cellSev.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF991B1B' } };
                        }
                        else if (d.severity === 'P2') {
                            cellSev.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
                            cellSev.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF9A3412' } };
                        }
                        else if (d.severity === 'P3') {
                            cellSev.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
                            cellSev.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF854D0E' } };
                        }
                    });
                });
                wsDefects.autoFilter = { from: 'A1', to: 'H1' };
                // Sheet 3: Discovered Endpoints
                const wsPages = wb.addWorksheet('Discovered Endpoints', {
                    views: [{ state: 'frozen', ySplit: 1 }]
                });
                wsPages.columns = [
                    { header: 'Parent Tested URL', key: 'parent', width: 45 },
                    { header: 'Page URL', key: 'url', width: 45 },
                    { header: 'Page Title', key: 'title', width: 32 },
                    { header: 'HTTP Status', key: 'status', width: 14 },
                    { header: 'Depth', key: 'depth', width: 12 },
                ];
                applyHeaderStyle(wsPages);
                items.forEach((u) => {
                    (u.crawledPages || []).forEach((p) => {
                        const row = wsPages.addRow({
                            parent: u.url,
                            url: p.url,
                            title: p.title || 'Untitled',
                            status: p.statusCode || 200,
                            depth: p.depth || 0,
                        });
                        row.height = 20;
                    });
                });
                wsPages.autoFilter = { from: 'A1', to: 'E1' };
                const buffer = await wb.xlsx.writeBuffer();
                res.writeHead(200, {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="TestPilot_Tested_URLs_Report_${now}.xlsx"`,
                });
                return res.end(Buffer.from(buffer));
            }
            return sendJson(200, { count: items.length, items });
        }
        // 10. Reset & Clear All Test Data (for testing multiple URLs cleanly)
        if ((pathname === '/api/reset' || pathname === '/api/clear') && (method === 'POST' || method === 'DELETE')) {
            await db.resetAllData();
            await vault.clearAll();
            return sendJson(200, {
                success: true,
                message: 'All test runs, defects, projects, and artifacts have been completely cleared and reset.',
            });
        }
        // 10b. Delete Specific Tested URL Data
        if ((pathname === '/api/urls' || pathname === '/api/urls/delete') && (method === 'DELETE' || method === 'POST')) {
            const body = method === 'POST' ? await getBody() : {};
            const targetUrl = parsedUrl.searchParams.get('url') || body.url;
            if (!targetUrl) {
                return sendJson(400, { error: 'Target URL is required for deletion' });
            }
            const result = await db.deleteUrlData(targetUrl);
            return sendJson(200, {
                success: true,
                message: `URL '${targetUrl}' and associated data have been removed from the vault.`,
                details: result,
            });
        }
        // 11. Design vs Code Comparison Routes (AI / Figma files & URLs)
        if (pathname === '/api/design-compare/presets' && method === 'GET') {
            return sendJson(200, designComparator.getPresets());
        }
        if (pathname === '/api/design-compare' && method === 'GET') {
            const list = await db.getDesignComparisons();
            return sendJson(200, list);
        }
        if (pathname.startsWith('/api/design-compare/') && method === 'GET' && pathname !== '/api/design-compare/presets') {
            const id = pathname.replace('/api/design-compare/', '');
            const item = await db.getDesignComparisonById(id);
            if (!item)
                return sendJson(404, { error: 'Design comparison not found' });
            return sendJson(200, item);
        }
        if (pathname.startsWith('/api/design-compare/') && method === 'DELETE') {
            const id = pathname.replace('/api/design-compare/', '');
            const deleted = await db.deleteDesignComparison(id);
            return sendJson(200, { success: deleted });
        }
        if (pathname === '/api/design-compare' && method === 'POST') {
            const body = await getBody();
            const targetUrl = (body.targetUrl || 'http://localhost:4000').trim();
            let fileBuffer;
            if (body.fileBase64) {
                const cleanBase64 = String(body.fileBase64).replace(/^data:[^;]+;base64,/, '');
                fileBuffer = Buffer.from(cleanBase64, 'base64');
            }
            let viewportWidth = 1280;
            let viewportHeight = 800;
            let viewportName = 'Desktop (1280x800)';
            if (body.viewport === 'desktop' || body.viewport === '1440x900') {
                viewportWidth = 1440;
                viewportHeight = 900;
                viewportName = 'Desktop (1440x900)';
            }
            else if (body.viewport === 'laptop' || body.viewport === '1280x800') {
                viewportWidth = 1280;
                viewportHeight = 800;
                viewportName = 'Laptop (1280x800)';
            }
            else if (body.viewport === 'tablet' || body.viewport === '768x1024') {
                viewportWidth = 768;
                viewportHeight = 1024;
                viewportName = 'Tablet (768x1024)';
            }
            else if (body.viewport === 'mobile' || body.viewport === '375x812') {
                viewportWidth = 375;
                viewportHeight = 812;
                viewportName = 'Mobile (375x812)';
            }
            try {
                const result = await designComparator.compare({
                    targetUrl,
                    sourceType: body.sourceType,
                    fileName: body.fileName,
                    fileBuffer,
                    figmaUrl: body.figmaUrl,
                    figmaToken: body.figmaToken,
                    adobeUrl: body.adobeUrl,
                    designUrl: body.designUrl,
                    presetId: body.presetId,
                    viewportWidth,
                    viewportHeight,
                    viewportName,
                    tolerance: typeof body.tolerance === 'number' ? body.tolerance : undefined,
                });
                await db.saveDesignComparison(result);
                await db.logAudit('DESIGN_COMPARE', 'SYSTEM', result.id, `Executed design comparison on ${targetUrl} (Fidelity: ${result.fidelityScore}%)`);
                return sendJson(200, result);
            }
            catch (err) {
                console.error('[Design Compare Error]:', err);
                return sendJson(500, { error: err.message || 'Failed to execute design comparison' });
            }
        }
        // --- MCP Suite API Routes ---
        if (pathname === '/api/mcp/servers' && method === 'GET') {
            const servers = mcp_suite_1.ALL_MCP_TOOLSETS.map((ts) => ({
                id: ts.name,
                name: ts.title,
                toolsCount: ts.tools.length,
                status: 'OPERATIONAL',
                protocolVersion: '2024-11-05',
                transport: 'stdio (JSON-RPC 2.0)',
            }));
            return sendJson(200, { servers, totalServers: servers.length });
        }
        if (pathname === '/api/mcp/tools' && method === 'GET') {
            const allTools = mcp_suite_1.ALL_MCP_TOOLSETS.flatMap((ts) => ts.tools.map((t) => ({
                server: ts.name,
                serverTitle: ts.title,
                ...t.tool,
            })));
            return sendJson(200, { tools: allTools, totalTools: allTools.length });
        }
        if (pathname === '/api/mcp/execute' && method === 'POST') {
            try {
                const body = await getBody();
                const { toolName, arguments: toolArgs = {} } = body;
                if (!toolName) {
                    return sendJson(400, { error: 'Missing required field: toolName' });
                }
                // Find tool across all sets
                let targetHandler = null;
                let parentServer = 'unknown';
                for (const ts of mcp_suite_1.ALL_MCP_TOOLSETS) {
                    const match = ts.tools.find((t) => t.tool.name === toolName);
                    if (match) {
                        targetHandler = match.handler;
                        parentServer = ts.name;
                        break;
                    }
                }
                if (!targetHandler) {
                    return sendJson(404, { error: `Tool '${toolName}' not found in any registered MCP server.` });
                }
                const result = await (0, mcp_suite_1.executeResilientTool)(toolName, () => targetHandler(toolArgs), { serverName: parentServer });
                return sendJson(200, result);
            }
            catch (err) {
                return sendJson(500, { error: err.message || 'Failed to execute MCP tool' });
            }
        }
        // --- Artifact Asset Serving ---
        if (pathname.startsWith('/api/artifacts/')) {
            const artifactRelative = pathname.replace(/^\/api\/artifacts\//, '');
            const artifactPath = path.resolve(vault.getBaseDir(), artifactRelative);
            try {
                const stats = await fs.stat(artifactPath);
                if (stats.isFile()) {
                    const ext = path.extname(artifactPath).toLowerCase();
                    const mimeTypes = {
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.svg': 'image/svg+xml',
                        '.json': 'application/json; charset=utf-8',
                        '.txt': 'text/plain; charset=utf-8',
                    };
                    const contentType = mimeTypes[ext] || 'application/octet-stream';
                    const content = await fs.readFile(artifactPath);
                    res.writeHead(200, { 'Content-Type': contentType });
                    return res.end(content);
                }
            }
            catch {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Artifact not found' }));
            }
        }
        // --- Static File Serving ---
        let filePath = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);
        try {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.svg': 'image/svg+xml',
            };
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            const content = await fs.readFile(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            return res.end(content);
        }
        catch {
            // Fallback for SPA routing
            try {
                const fallback = await fs.readFile(path.join(publicDir, 'index.html'), 'utf-8');
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                return res.end(fallback);
            }
            catch {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                return res.end('Not Found');
            }
        }
    });
    return new Promise((resolve) => {
        server.listen(PORT, () => {
            console.log(`[TestPilot AI Dashboard] Running on http://localhost:${PORT}`);
            resolve({ server, fixtureServer });
        });
    });
}
// Auto-run if executed directly
if (require.main === module) {
    startServer().catch((err) => {
        console.error('Failed to start TestPilot AI server:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=server.js.map