import * as http from 'node:http';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { URL } from 'node:url';
import { TestPilotDatabase, ArtifactVault } from '@testpilot/storage';
import { createFixtureServer } from '@testpilot/fixture-site';
import { TestPilotRunner, RunProgressEvent } from './runner.js';
import ExcelJS from 'exceljs';

const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);
const FIXTURE_PORT = 4000;

export async function startServer(customPort?: number): Promise<{ server: http.Server; fixtureServer?: http.Server }> {
  const PORT = customPort || DEFAULT_PORT;
  const db = new TestPilotDatabase();
  const vault = new ArtifactVault();
  const runner = new TestPilotRunner(db, vault);
  const activeSessions = new Map<string, any>();

  // Auto-boot benchmark fixture site on port 4000 for immediate out-of-the-box verification
  let fixtureServer: http.Server | undefined;
  try {
    fixtureServer = createFixtureServer();
    fixtureServer.listen(FIXTURE_PORT, () => {
      console.log(`[TestPilot Fixture Site] Running on http://localhost:${FIXTURE_PORT}`);
    });
    fixtureServer.on('error', () => {
      console.log(`[TestPilot Fixture Site] Port ${FIXTURE_PORT} already in use or unavailable.`);
    });
  } catch (e) {
    console.log('[TestPilot Fixture Site] Could not start fixture server:', e);
  }

  const publicDir = path.resolve(__dirname, '..', 'public');

  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
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

    const sendJson = (status: number, data: any) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    };

    const getBody = async (): Promise<any> => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const raw = Buffer.concat(chunks).toString('utf-8');
      try {
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    };

    // --- API Routes ---

    // 0. Authentication Routes
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await getBody();
      const identifier = String(body.email || body.username || '').trim();
      const password = String(body.password || '').trim();
      const rememberMe = Boolean(body.rememberMe);

      if (!identifier) {
        return sendJson(400, { error: 'Username or Email address is required' });
      }
      if (!password) {
        return sendJson(400, { error: 'Password is required' });
      }
      if (password.length < 3) {
        return sendJson(400, { error: 'Password must be at least 3 characters long' });
      }

      const displayName = identifier.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const user = {
        id: `usr_${identifier.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
        name: displayName || 'Authenticated User',
        email: identifier.includes('@') ? identifier : `${identifier}@testpilot.ai`,
        username: identifier,
        role: identifier.toLowerCase().includes('admin') ? 'Enterprise QA Lead' : 'Quality Engineer',
        initials: (displayName || 'AU').split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase() || 'AU',
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

      const user = {
        id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: name,
        email: email,
        username: email.split('@')[0],
        role: 'Quality Engineer',
        initials: name.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase() || 'QE',
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
          allowedDomains: body.allowedDomains || [new URL(body.primaryUrl).hostname],
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
      return sendJson(200, runs);
    }

    // 4. Test Run Detail
    if (pathname.startsWith('/api/test-runs/') && method === 'GET' && !pathname.endsWith('/events')) {
      const id = pathname.replace('/api/test-runs/', '');
      const run = await db.getTestRunById(id);
      if (!run) return sendJson(404, { error: 'Test run not found' });
      return sendJson(200, run);
    }

    // 5. Start Test Run
    if (pathname === '/api/test-runs/start' && method === 'POST') {
      const body = await getBody();
      const primaryUrl = body.scopeOverride?.primaryUrl || body.targetUrl || 'http://localhost:4000';
      let targetHost = 'localhost';
      try {
        targetHost = new URL(primaryUrl).hostname;
      } catch {
        return sendJson(400, { error: `Invalid target URL: '${primaryUrl}'` });
      }

      let project = body.projectId ? await db.getProjectById(body.projectId) : null;
      if (!project) {
        const projects = await db.getProjects();
        project = projects.find((p) => {
          try {
            return new URL(p.primaryUrl).hostname === targetHost;
          } catch {
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

      const unsubscribe = runner.subscribe(runId, (event: RunProgressEvent) => {
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
      return sendJson(200, defects);
    }

    if (pathname.startsWith('/api/defects/') && method === 'PATCH') {
      const id = pathname.replace('/api/defects/', '');
      const body = await getBody();
      if (!body.status) return sendJson(400, { error: 'Missing status' });
      const updated = await db.updateDefectStatus(id, body.status);
      if (!updated) return sendJson(404, { error: 'Defect not found' });
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

      const norm = (u: string) => (u || '').trim().replace(/\/$/, '');
      const urlMap = new Map<string, any>();

      runs.forEach((run) => {
        const prim = run.primaryUrl || (run as any).scope?.primaryUrl;
        if (!prim) return;
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
        const rootUrl = (session as any).primaryUrl || (session as any).startUrl ? norm((session as any).primaryUrl || (session as any).startUrl) : null;
        const rootItem = rootUrl ? urlMap.get(rootUrl) : null;
        (session.pages || []).forEach((page) => {
          if (!page.url) return;
          const normUrl = norm(page.url);
          if (rootItem && !rootItem.crawledPages.some((p: any) => norm(p.url) === normUrl)) {
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

      const allKnownPages: any[] = [];
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
        const rawUrl = defect.affectedUrl || (defect as any).pageUrl || '';
        const normRaw = norm(rawUrl);
        if (normRaw && urlMap.has(normRaw)) matchedItem = urlMap.get(normRaw);
        if (!matchedItem && allKnownPages.length > 0) {
          const pm = allKnownPages.find((p) => norm(p.url) === normRaw);
          if (pm && urlMap.has(norm(pm.url))) matchedItem = urlMap.get(norm(pm.url));
        }
        if (!matchedItem && defect.title) {
          for (const page of allKnownPages) {
            try {
              const path = new URL(page.url).pathname;
              if (path.length > 1 && defect.title.includes(path) && urlMap.has(norm(page.url))) {
                matchedItem = urlMap.get(norm(page.url));
                break;
              }
            } catch {}
          }
        }
        if (!matchedItem && defect.testRunId) {
          const run = runs.find((r) => r.id === defect.testRunId);
          if (run) {
            const prim = norm(run.primaryUrl || (run as any).scope?.primaryUrl);
            if (prim && urlMap.has(prim)) matchedItem = urlMap.get(prim);
          }
        }
        if (matchedItem && !matchedItem.defects.some((d: any) => d.id === defect.id)) {
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
          const p1 = u.defects.filter((d: any) => d.severity === 'P1').length;
          const p2 = u.defects.filter((d: any) => d.severity === 'P2').length;
          let health = 'ALL_PASSED';
          if (p1 > 0) health = `CRITICAL (${p1} P1)`;
          else if (p2 > 0) health = `HIGH (${p2} P2)`;
          else if (u.defects.length > 0) health = `DEFECTS (${u.defects.length})`;

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
        const wb = new ExcelJS.Workbook();
        wb.creator = 'TestPilot AI Platform';
        wb.lastModifiedBy = 'TestPilot AI Platform';
        wb.created = new Date();
        wb.modified = new Date();

        const applyHeaderStyle = (ws: ExcelJS.Worksheet) => {
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
          const p1 = u.defects.filter((d: any) => d.severity === 'P1').length;
          const p2 = u.defects.filter((d: any) => d.severity === 'P2').length;
          let health = 'ALL_PASSED';
          if (p1 > 0) health = `CRITICAL (${p1} P1)`;
          else if (p2 > 0) health = `HIGH (${p2} P2)`;
          else if (u.defects.length > 0) health = `DEFECTS (${u.defects.length})`;

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
          } else if (p2 > 0) {
            cellHealth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
            cellHealth.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF9A3412' } };
          } else if (u.defects.length > 0) {
            cellHealth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
            cellHealth.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF854D0E' } };
          } else {
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
          u.defects.forEach((d: any) => {
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
            } else if (d.severity === 'P2') {
              cellSev.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
              cellSev.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF9A3412' } };
            } else if (d.severity === 'P3') {
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
          (u.crawledPages || []).forEach((p: any) => {
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
    if ((pathname === '/api/reset' || pathname === '/api/clear') && method === 'POST') {
      await db.resetAllData();
      await vault.clearAll();
      return sendJson(200, {
        success: true,
        message: 'All test runs, defects, projects, and artifacts have been completely cleared and reset.',
      });
    }

    // --- Artifact Asset Serving ---
    if (pathname.startsWith('/api/artifacts/')) {
      const artifactRelative = pathname.replace(/^\/api\/artifacts\//, '');
      const artifactPath = path.resolve(vault.getBaseDir(), artifactRelative);
      try {
        const stats = await fs.stat(artifactPath);
        if (stats.isFile()) {
          const ext = path.extname(artifactPath).toLowerCase();
          const mimeTypes: Record<string, string> = {
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
      } catch {
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
      const mimeTypes: Record<string, string> = {
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
    } catch {
      // Fallback for SPA routing
      try {
        const fallback = await fs.readFile(path.join(publicDir, 'index.html'), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(fallback);
      } catch {
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
