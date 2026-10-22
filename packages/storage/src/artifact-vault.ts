import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface SavedArtifactInfo {
  path: string;
  filename: string;
  relativeUrl: string;
  sizeBytes: number;
  contentType: string;
  savedAt: string;
}

export class ArtifactVault {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.env.TESTPILOT_STORAGE_DIR || path.resolve(process.cwd(), 'data', 'artifacts');
  }

  public getBaseDir(): string {
    return this.baseDir;
  }

  private async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  /**
   * Redacts sensitive information like authorization headers, bearer tokens,
   * passwords, session cookies, and API keys.
   */
  public redactSensitiveData(input: string): string {
    let sanitized = input;
    // Authorization bearer tokens
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]');
    // Password fields in JSON / forms
    sanitized = sanitized.replace(/"password"\s*:\s*"[^"]+"/gi, '"password": "[REDACTED]"');
    sanitized = sanitized.replace(/password=[^&\s]+/gi, 'password=[REDACTED]');
    // API keys / secret tokens
    sanitized = sanitized.replace(/(api[_-]?key|secret[_-]?token|auth[_-]?token)=([A-Za-z0-9_-]+)/gi, '$1=[REDACTED]');
    // Cookie session tokens
    sanitized = sanitized.replace(/(session_id|session|jwt|token)=([A-Za-z0-9_\-.]+)/gi, '$1=[REDACTED]');
    return sanitized;
  }

  /**
   * Saves a screenshot PNG buffer.
   */
  public async saveScreenshot(
    runId: string,
    filename: string,
    buffer: Buffer
  ): Promise<SavedArtifactInfo> {
    const runDir = path.join(this.baseDir, runId, 'screenshots');
    await this.ensureDir(runDir);

    const safeFilename = filename.endsWith('.png') ? filename : `${filename}.png`;
    const fullPath = path.join(runDir, safeFilename);

    await fs.writeFile(fullPath, buffer);
    const stats = await fs.stat(fullPath);

    return {
      path: fullPath,
      filename: safeFilename,
      relativeUrl: `/api/artifacts/${runId}/screenshots/${safeFilename}`,
      sizeBytes: stats.size,
      contentType: 'image/png',
      savedAt: new Date().toISOString(),
    };
  }

  /**
   * Saves JSON data (such as network HAR, accessibility reports, console events).
   */
  public async saveJson(
    runId: string,
    filename: string,
    data: unknown
  ): Promise<SavedArtifactInfo> {
    const runDir = path.join(this.baseDir, runId, 'data');
    await this.ensureDir(runDir);

    const safeFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
    const fullPath = path.join(runDir, safeFilename);

    const rawJson = JSON.stringify(data, null, 2);
    const sanitized = this.redactSensitiveData(rawJson);

    await fs.writeFile(fullPath, sanitized, 'utf-8');
    const stats = await fs.stat(fullPath);

    return {
      path: fullPath,
      filename: safeFilename,
      relativeUrl: `/api/artifacts/${runId}/data/${safeFilename}`,
      sizeBytes: stats.size,
      contentType: 'application/json',
      savedAt: new Date().toISOString(),
    };
  }

  /**
   * Saves text data (such as raw console logs, trace logs, or reproduction scripts).
   */
  public async saveText(
    runId: string,
    filename: string,
    text: string,
    contentType = 'text/plain'
  ): Promise<SavedArtifactInfo> {
    const runDir = path.join(this.baseDir, runId, 'logs');
    await this.ensureDir(runDir);

    const fullPath = path.join(runDir, filename);
    const sanitized = this.redactSensitiveData(text);

    await fs.writeFile(fullPath, sanitized, 'utf-8');
    const stats = await fs.stat(fullPath);

    return {
      path: fullPath,
      filename,
      relativeUrl: `/api/artifacts/${runId}/logs/${filename}`,
      sizeBytes: stats.size,
      contentType,
      savedAt: new Date().toISOString(),
    };
  }

  /**
   * Reads an artifact file.
   */
  public async getArtifact(subPath: string): Promise<Buffer | null> {
    try {
      const fullPath = path.join(this.baseDir, subPath);
      // Prevent path traversal
      if (!fullPath.startsWith(this.baseDir)) {
        return null;
      }
      return await fs.readFile(fullPath);
    } catch {
      return null;
    }
  }

  /**
   * Clears all stored artifact files (screenshots, logs, reports).
   */
  public async clearAll(): Promise<void> {
    try {
      await fs.rm(this.baseDir, { recursive: true, force: true });
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  }
}
