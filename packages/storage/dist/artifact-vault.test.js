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
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs/promises"));
const artifact_vault_js_1 = require("./artifact-vault.js");
(0, node_test_1.describe)('ArtifactVault', () => {
    (0, node_test_1.it)('redacts sensitive credentials from JSON and text strings', () => {
        const vault = new artifact_vault_js_1.ArtifactVault();
        const sensitive = 'User token: Bearer abc123secret and {"password": "superSecretPassword123"}';
        const sanitized = vault.redactSensitiveData(sensitive);
        assert.strictEqual(sanitized.includes('superSecretPassword123'), false);
        assert.strictEqual(sanitized.includes('abc123secret'), false);
        assert.strictEqual(sanitized.includes('[REDACTED]'), true);
    });
    (0, node_test_1.it)('persists screenshots and returns accurate artifact metadata', async () => {
        const tempDir = path.join(os.tmpdir(), `testpilot-test-${Date.now()}`);
        const vault = new artifact_vault_js_1.ArtifactVault(tempDir);
        const fakePng = Buffer.from('FAKE_PNG_BINARY_CONTENT');
        const result = await vault.saveScreenshot('run-123', 'home-page', fakePng);
        assert.strictEqual(result.filename, 'home-page.png');
        assert.strictEqual(result.contentType, 'image/png');
        assert.strictEqual(result.sizeBytes, fakePng.length);
        assert.strictEqual(result.relativeUrl, '/api/artifacts/run-123/screenshots/home-page.png');
        // Verify file actually exists on disk
        const onDisk = await fs.readFile(result.path);
        assert.strictEqual(onDisk.toString(), 'FAKE_PNG_BINARY_CONTENT');
        // Clean up temp
        await fs.rm(tempDir, { recursive: true, force: true });
    });
});
//# sourceMappingURL=artifact-vault.test.js.map