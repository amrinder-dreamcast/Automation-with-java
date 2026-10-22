import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { ArtifactVault } from './artifact-vault.js';

describe('ArtifactVault', () => {
  it('redacts sensitive credentials from JSON and text strings', () => {
    const vault = new ArtifactVault();
    const sensitive = 'User token: Bearer abc123secret and {"password": "superSecretPassword123"}';
    const sanitized = vault.redactSensitiveData(sensitive);

    assert.strictEqual(sanitized.includes('superSecretPassword123'), false);
    assert.strictEqual(sanitized.includes('abc123secret'), false);
    assert.strictEqual(sanitized.includes('[REDACTED]'), true);
  });

  it('persists screenshots and returns accurate artifact metadata', async () => {
    const tempDir = path.join(os.tmpdir(), `testpilot-test-${Date.now()}`);
    const vault = new ArtifactVault(tempDir);

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
