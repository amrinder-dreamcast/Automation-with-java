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
        assert.strictEqual(data.user.name, 'Admin');
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
    (0, node_test_1.it)('registers a new user, returning 201 and active session token', async () => {
        const res = await fetch(`${BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Sarah Connor',
                email: 'sarah.connor@cyberdyne.ai',
                password: 'securePass123!',
            }),
        });
        assert.strictEqual(res.status, 201);
        const cookie = res.headers.get('set-cookie');
        assert.ok(cookie && cookie.includes('testpilot_session='));
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.user.name, 'Sarah Connor');
        assert.strictEqual(data.user.email, 'sarah.connor@cyberdyne.ai');
        assert.strictEqual(data.user.initials, 'SC');
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
});
//# sourceMappingURL=server.test.js.map