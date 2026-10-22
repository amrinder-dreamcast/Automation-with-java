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
const server_js_1 = require("./server.js");
(0, node_test_1.describe)('Fixture Benchmark Site', () => {
    let server;
    const PORT = 4099;
    const BASE = `http://localhost:${PORT}`;
    (0, node_test_1.before)((_, done) => {
        server = (0, server_js_1.createFixtureServer)();
        server.listen(PORT, done);
    });
    (0, node_test_1.after)((_, done) => {
        server.close(done);
    });
    (0, node_test_1.it)('serves 200 homepage with interactive counter element', async () => {
        const res = await fetch(`${BASE}/`);
        assert.strictEqual(res.status, 200);
        const body = await res.text();
        assert.strictEqual(body.includes('TestPilot Benchmark'), true);
        assert.strictEqual(body.includes('counter-btn'), true);
    });
    (0, node_test_1.it)('returns 404 for broken link target', async () => {
        const res = await fetch(`${BASE}/broken-target-404`);
        assert.strictEqual(res.status, 404);
    });
    (0, node_test_1.it)('serves accessibility page with expected WCAG failure landmarks', async () => {
        const res = await fetch(`${BASE}/accessibility`);
        const body = await res.text();
        assert.strictEqual(body.includes('a11y-img-no-alt'), true);
        assert.strictEqual(body.includes('empty-icon-btn'), true);
    });
    (0, node_test_1.it)('handles authentication failure and success', async () => {
        // 1. Bad credentials
        const badRes = await fetch(`${BASE}/auth/login`, {
            method: 'POST',
            body: 'email=bad@test.com&password=wrong',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        assert.strictEqual(badRes.status, 401);
        // 2. Good credentials
        const goodRes = await fetch(`${BASE}/auth/login`, {
            method: 'POST',
            body: 'email=admin%40testpilot.ai&password=pilotPass123!',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            redirect: 'manual',
        });
        assert.strictEqual(goodRes.status, 302);
        const cookie = goodRes.headers.get('set-cookie');
        assert.ok(cookie && cookie.includes('session_id='));
    });
});
//# sourceMappingURL=server.test.js.map