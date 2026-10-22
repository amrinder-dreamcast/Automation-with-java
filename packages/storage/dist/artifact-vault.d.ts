export interface SavedArtifactInfo {
    path: string;
    filename: string;
    relativeUrl: string;
    sizeBytes: number;
    contentType: string;
    savedAt: string;
}
export declare class ArtifactVault {
    private baseDir;
    constructor(baseDir?: string);
    getBaseDir(): string;
    private ensureDir;
    /**
     * Redacts sensitive information like authorization headers, bearer tokens,
     * passwords, session cookies, and API keys.
     */
    redactSensitiveData(input: string): string;
    /**
     * Saves a screenshot PNG buffer.
     */
    saveScreenshot(runId: string, filename: string, buffer: Buffer): Promise<SavedArtifactInfo>;
    /**
     * Saves JSON data (such as network HAR, accessibility reports, console events).
     */
    saveJson(runId: string, filename: string, data: unknown): Promise<SavedArtifactInfo>;
    /**
     * Saves text data (such as raw console logs, trace logs, or reproduction scripts).
     */
    saveText(runId: string, filename: string, text: string, contentType?: string): Promise<SavedArtifactInfo>;
    /**
     * Reads an artifact file.
     */
    getArtifact(subPath: string): Promise<Buffer | null>;
    /**
     * Clears all stored artifact files (screenshots, logs, reports).
     */
    clearAll(): Promise<void>;
}
//# sourceMappingURL=artifact-vault.d.ts.map