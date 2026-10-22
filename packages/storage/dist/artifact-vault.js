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
exports.ArtifactVault = void 0;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
class ArtifactVault {
    baseDir;
    constructor(baseDir) {
        this.baseDir = baseDir || process.env.TESTPILOT_STORAGE_DIR || path.resolve(process.cwd(), 'data', 'artifacts');
    }
    getBaseDir() {
        return this.baseDir;
    }
    async ensureDir(dirPath) {
        await fs.mkdir(dirPath, { recursive: true });
    }
    /**
     * Redacts sensitive information like authorization headers, bearer tokens,
     * passwords, session cookies, and API keys.
     */
    redactSensitiveData(input) {
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
    async saveScreenshot(runId, filename, buffer) {
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
    async saveJson(runId, filename, data) {
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
    async saveText(runId, filename, text, contentType = 'text/plain') {
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
    async getArtifact(subPath) {
        try {
            const fullPath = path.join(this.baseDir, subPath);
            // Prevent path traversal
            if (!fullPath.startsWith(this.baseDir)) {
                return null;
            }
            return await fs.readFile(fullPath);
        }
        catch {
            return null;
        }
    }
    /**
     * Clears all stored artifact files (screenshots, logs, reports).
     */
    async clearAll() {
        try {
            await fs.rm(this.baseDir, { recursive: true, force: true });
            await fs.mkdir(this.baseDir, { recursive: true });
        }
        catch {
            // Ignore if directory doesn't exist
        }
    }
}
exports.ArtifactVault = ArtifactVault;
//# sourceMappingURL=artifact-vault.js.map