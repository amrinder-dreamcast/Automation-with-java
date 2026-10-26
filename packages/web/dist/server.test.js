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
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const runner_js_1 = require("./runner.js");
const storage_1 = require("@testpilot/storage");
const server_js_1 = require("./server.js");
(0, node_test_1.describe)('@testpilot/web Service Suite', () => {
    let serverInstance;
    let fixtureInstance;
    const TEST_PORT = 3199;
    const BASE = `http://localhost:${TEST_PORT}`;
    (0, node_test_1.before)(async () => {
        const res = await (0, server_js_1.startServer)(TEST_PORT);
        serverInstance = res.server;
        fixtureInstance = res.fixtureServer;
    });
    (0, node_test_1.after)((_, done) => {
        fixtureInstance?.closeAllConnections?.();
        serverInstance?.closeAllConnections?.();
        if (fixtureInstance) {
            fixtureInstance.close(() => {
                if (serverInstance)
                    serverInstance.close(done);
                else
                    done();
            });
        }
        else if (serverInstance) {
            serverInstance.close(done);
        }
        else {
            done();
        }
    });
    (0, node_test_1.it)('instantiates TestPilotRunner with database and artifact vault', () => {
        const db = new storage_1.TestPilotDatabase();
        const vault = new storage_1.ArtifactVault();
        const runner = new runner_js_1.TestPilotRunner(db, vault);
        assert.ok(runner, 'Runner should instantiate cleanly');
        const unsub = runner.subscribe('run-sample', () => { });
        assert.strictEqual(typeof unsub, 'function', 'Runner subscription should return unsubscribe function');
        unsub();
    });
    (0, node_test_1.it)('serves /api/status with system health', async () => {
        const res = await fetch(`${BASE}/api/status`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.status, 'ONLINE');
        assert.ok(data.stats);
    });
    (0, node_test_1.it)('serves /api/export/sheet as JSON by default', async () => {
        const res = await fetch(`${BASE}/api/export/sheet`);
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get('content-type')?.includes('application/json'));
        const data = await res.json();
        assert.ok(typeof data.count === 'number');
        assert.ok(Array.isArray(data.items));
    });
    (0, node_test_1.it)('serves /api/export/sheet?format=csv with UTF-8 BOM and aligned CSV headers', async () => {
        const res = await fetch(`${BASE}/api/export/sheet?format=csv`);
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get('content-type')?.includes('text/csv'));
        assert.ok(res.headers.get('content-disposition')?.includes('attachment; filename='));
        const arrayBuf = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        // Verify UTF-8 BOM bytes (EF BB BF)
        assert.strictEqual(bytes[0], 0xef, 'Expected BOM byte 0');
        assert.strictEqual(bytes[1], 0xbb, 'Expected BOM byte 1');
        assert.strictEqual(bytes[2], 0xbf, 'Expected BOM byte 2');
        const text = new TextDecoder('utf-8').decode(arrayBuf);
        assert.ok(text.includes('Tested URL'));
        assert.ok(text.includes('Overall Health'));
        assert.ok(text.includes('P1 Critical'));
    });
    (0, node_test_1.it)('serves /api/export/sheet?format=xlsx with binary OpenXML spreadsheet', async () => {
        const res = await fetch(`${BASE}/api/export/sheet?format=xlsx`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        assert.ok(res.headers.get('content-disposition')?.includes('attachment; filename='));
        const buffer = await res.arrayBuffer();
        assert.ok(buffer.byteLength > 1000, 'Expected non-empty XLSX binary buffer');
        // Verify ZIP magic header PK\x03\x04 for .xlsx OpenXML archive
        const header = new Uint8Array(buffer.slice(0, 4));
        assert.strictEqual(header[0], 0x50, 'Expected "P"');
        assert.strictEqual(header[1], 0x4b, 'Expected "K"');
        assert.strictEqual(header[2], 0x03, 'Expected 0x03');
        assert.strictEqual(header[3], 0x04, 'Expected 0x04');
    });
    (0, node_test_1.it)('rejects login with missing email or password', async () => {
        const res = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: '', password: '' }),
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.ok(data.error);
    });
    (0, node_test_1.it)('logs in user with username and password, returns session and user profile', async () => {
        const res = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@testpilot.ai', password: 'pilotPass123!', rememberMe: true }),
        });
        assert.strictEqual(res.status, 200);
        const cookie = res.headers.get('set-cookie');
        assert.ok(cookie && cookie.includes('testpilot_session='));
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.token);
        assert.strictEqual(data.user.email, 'admin@testpilot.ai');
        assert.strictEqual(data.user.name, 'Admin User');
        // Test session verification
        const sessionRes = await fetch(`${BASE}/api/auth/session`, {
            headers: { Cookie: cookie },
        });
        assert.strictEqual(sessionRes.status, 200);
        const sessionData = await sessionRes.json();
        assert.strictEqual(sessionData.authenticated, true);
        assert.strictEqual(sessionData.user.email, 'admin@testpilot.ai');
        // Test logout
        const logoutRes = await fetch(`${BASE}/api/auth/logout`, {
            method: 'POST',
            headers: { Cookie: cookie },
        });
        assert.strictEqual(logoutRes.status, 200);
        const logoutData = await logoutRes.json();
        assert.strictEqual(logoutData.success, true);
    });
    (0, node_test_1.it)('rejects login with incorrect password', async () => {
        const res = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@testpilot.ai', password: 'wrongPassword123' }),
        });
        assert.strictEqual(res.status, 401);
        const data = await res.json();
        assert.ok(data.error);
        assert.ok(data.error.includes('Invalid credentials'));
    });
    (0, node_test_1.it)('rejects login for unregistered user', async () => {
        const res = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'unregistered@testpilot.ai', password: 'somePassword123' }),
        });
        assert.strictEqual(res.status, 401);
        const data = await res.json();
        assert.ok(data.error);
    });
    (0, node_test_1.it)('rejects registration with incomplete details', async () => {
        const res = await fetch(`${BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: '', email: 'notanemail', password: '1' }),
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.ok(data.error);
    });
    (0, node_test_1.it)('registers a new user, returning 201 and allows login with valid credentials only', async () => {
        const testEmail = `sarah.connor.${Date.now()}@cyberdyne.ai`;
        const res = await fetch(`${BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Sarah Connor',
                email: testEmail,
                password: 'securePass123!',
            }),
        });
        assert.strictEqual(res.status, 201);
        const cookie = res.headers.get('set-cookie');
        assert.ok(cookie && cookie.includes('testpilot_session='));
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.user.name, 'Sarah Connor');
        assert.strictEqual(data.user.email, testEmail);
        assert.strictEqual(data.user.initials, 'SC');
        // Attempt login with incorrect password -> should fail with 401
        const badLogin = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: 'wrongPassword!',
            }),
        });
        assert.strictEqual(badLogin.status, 401);
        const badData = await badLogin.json();
        assert.ok(badData.error);
        // Attempt login with valid registered credentials -> should succeed with 200
        const goodLogin = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: 'securePass123!',
            }),
        });
        assert.strictEqual(goodLogin.status, 200);
        const goodData = await goodLogin.json();
        assert.strictEqual(goodData.success, true);
        assert.strictEqual(goodData.user.name, 'Sarah Connor');
        assert.strictEqual(goodData.user.email, testEmail);
    });
    (0, node_test_1.it)('rejects duplicate registration with existing email', async () => {
        const res = await fetch(`${BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Imposter',
                email: 'admin@testpilot.ai',
                password: 'anotherPassword123!',
            }),
        });
        assert.strictEqual(res.status, 409);
        const data = await res.json();
        assert.ok(data.error);
        assert.ok(data.error.includes('already exists'));
    });
    (0, node_test_1.it)('handles forgot password requests cleanly', async () => {
        // Missing email
        const badRes = await fetch(`${BASE}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: '' }),
        });
        assert.strictEqual(badRes.status, 400);
        // Valid email
        const goodRes = await fetch(`${BASE}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@testpilot.ai' }),
        });
        assert.strictEqual(goodRes.status, 200);
        const data = await goodRes.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.message.includes('Recovery instructions'));
    });
    (0, node_test_1.it)('serves design compare presets including Figma, Illustrator AI, and Adobe XD specs', async () => {
        const res = await fetch(`${BASE}/api/design-compare/presets`);
        assert.strictEqual(res.status, 200);
        const presets = await res.json();
        assert.ok(Array.isArray(presets));
        assert.ok(presets.length >= 4);
        assert.ok(presets.some((p) => p.category === 'FIGMA'));
        assert.ok(presets.some((p) => p.category === 'AI'));
        assert.ok(presets.some((p) => p.category === 'XD'));
        assert.ok(presets.some((p) => p.category === 'PHOTOSHOP'));
    });
    (0, node_test_1.it)('executes design vs code comparison on given URL and returns UI issues, snapshots and fidelity score', async () => {
        const res = await fetch(`${BASE}/api/design-compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetUrl: 'http://localhost:4000',
                presetId: 'fixture-benchmark-homepage',
                viewport: 'desktop',
            }),
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.ok(data.id);
        assert.strictEqual(data.targetUrl, 'http://localhost:4000');
        assert.ok(typeof data.fidelityScore === 'number');
        assert.ok(Array.isArray(data.issues));
        assert.ok(data.designSnapshotPath);
        assert.ok(data.liveSnapshotPath);
        assert.ok(data.diffOverlayPath);
        assert.ok(data.metrics.colorAccuracyPercent > 0);
        // Verify it is saved in history
        const listRes = await fetch(`${BASE}/api/design-compare`);
        assert.strictEqual(listRes.status, 200);
        const list = await listRes.json();
        assert.ok(list.some((item) => item.id === data.id));
    });
    (0, node_test_1.it)('serves /api/mcp/servers listing all 10 MCP integrations', async () => {
        const res = await fetch(`${BASE}/api/mcp/servers`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.ok(data.servers.length >= 10);
        const serverIds = data.servers.map((s) => s.id);
        assert.ok(serverIds.includes('playwright'));
        assert.ok(serverIds.includes('maestro'));
        assert.ok(serverIds.includes('cypress'));
        assert.ok(serverIds.includes('browserstack'));
        assert.ok(serverIds.includes('k6'));
        assert.ok(serverIds.includes('reportportal'));
        assert.ok(serverIds.includes('vibium'));
        assert.ok(serverIds.includes('thunder'));
        assert.ok(serverIds.includes('accessibility'));
        assert.ok(serverIds.includes('testguild'));
    });
    (0, node_test_1.it)('serves /api/mcp/tools listing all registered tool schemas', async () => {
        const res = await fetch(`${BASE}/api/mcp/tools`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.ok(data.tools.length >= 20);
        assert.ok(data.tools.some((t) => t.name === 'playwright_inspect_dom'));
        assert.ok(data.tools.some((t) => t.name === 'k6_run_load_test'));
        assert.ok(data.tools.some((t) => t.name === 'axe_check_contrast'));
    });
    (0, node_test_1.it)('executes an MCP tool via POST /api/mcp/execute', async () => {
        const res = await fetch(`${BASE}/api/mcp/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolName: 'axe_check_contrast',
                arguments: {
                    foregroundHex: '#111827',
                    backgroundHex: '#FFFFFF',
                },
            }),
        });
        assert.strictEqual(res.status, 200);
        const result = await res.json();
        assert.ok(!result.isError);
        assert.ok(result.content[0].text.includes('COMPLIANT'));
    });
});
//# sourceMappingURL=server.test.js.map