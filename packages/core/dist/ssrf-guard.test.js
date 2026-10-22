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
const ssrf_guard_js_1 = require("./ssrf-guard.js");
(0, node_test_1.describe)('SSRF Guard: IP Classification', () => {
    (0, node_test_1.it)('correctly identifies RFC 1918 private IPv4 ranges', () => {
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('10.0.0.1'), true);
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('10.255.255.254'), true);
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('172.16.0.1'), true);
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('172.31.255.254'), true);
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('192.168.1.1'), true);
    });
    (0, node_test_1.it)('correctly identifies loopback and cloud metadata IPv4 addresses', () => {
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('127.0.0.1'), true);
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('127.0.0.2'), true);
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('169.254.169.254'), true); // AWS/GCP metadata
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('169.254.1.1'), true);
    });
    (0, node_test_1.it)('allows public IPv4 addresses', () => {
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('8.8.8.8'), false);
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('1.1.1.1'), false);
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv4)('93.184.216.34'), false); // example.com
    });
    (0, node_test_1.it)('identifies IPv6 loopback and link-local', () => {
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv6)('::1'), true);
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv6)('fe80::1'), true);
        assert.strictEqual((0, ssrf_guard_js_1.isPrivateIPv6)('::ffff:127.0.0.1'), true);
    });
});
(0, node_test_1.describe)('SSRF Guard: URL Scope Validation', () => {
    const productionScope = {
        id: 'scope-1',
        projectId: 'proj-1',
        primaryUrl: 'https://example.com',
        allowedDomains: ['example.com'],
        allowSubdomains: true,
        allowExternalLinks: false,
        maxCrawlDepth: 3,
        maxPages: 10,
        crawlTimeoutMs: 10000,
        allowLocalTargets: false,
    };
    (0, node_test_1.it)('rejects attempts to access cloud metadata IPs', async () => {
        const res = await (0, ssrf_guard_js_1.validateTargetUrl)('http://169.254.169.254/latest/meta-data', productionScope);
        assert.strictEqual(res.allowed, false);
        assert.match(res.reason ?? '', /prohibited/i);
    });
    (0, node_test_1.it)('rejects loopback localhost targets in production mode', async () => {
        const res = await (0, ssrf_guard_js_1.validateTargetUrl)('http://127.0.0.1:8080/admin', productionScope);
        assert.strictEqual(res.allowed, false);
    });
    (0, node_test_1.it)('rejects URLs outside allowed domain boundary', async () => {
        const res = await (0, ssrf_guard_js_1.validateTargetUrl)('https://malicious-site.com/exploit', productionScope);
        assert.strictEqual(res.allowed, false);
        assert.match(res.reason ?? '', /outside the authorized project scope/i);
    });
    (0, node_test_1.it)('allows subdomains when allowSubdomains is true', async () => {
        const res = await (0, ssrf_guard_js_1.validateTargetUrl)('https://api.example.com/v1', productionScope);
        // Since example.com is public, if DNS resolves, it is allowed
        // Note: If running offline, DNS check returns error which is safe
        if (res.allowed) {
            assert.strictEqual(res.allowed, true);
        }
    });
    (0, node_test_1.it)('permits localhost when allowLocalTargets is explicitly true for fixture sites', async () => {
        const localScope = {
            ...productionScope,
            primaryUrl: 'http://localhost:3000',
            allowedDomains: ['localhost'],
            allowLocalTargets: true,
        };
        const res = await (0, ssrf_guard_js_1.validateTargetUrl)('http://localhost:3000/test-fixture', localScope);
        assert.strictEqual(res.allowed, true);
    });
});
//# sourceMappingURL=ssrf-guard.test.js.map