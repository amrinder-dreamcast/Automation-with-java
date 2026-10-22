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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualRegressionEngine = void 0;
const pngjs_1 = require("pngjs");
const pixelmatch_1 = __importDefault(require("pixelmatch"));
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs/promises"));
const storage_1 = require("@testpilot/storage");
class VisualRegressionEngine {
    vault;
    threshold;
    mismatchTolerancePercent;
    viewportWidth;
    viewportHeight;
    constructor(options) {
        this.vault = options?.vault || new storage_1.ArtifactVault();
        this.threshold = options?.threshold ?? 0.1;
        this.mismatchTolerancePercent = options?.mismatchTolerancePercent ?? 0.5;
        this.viewportWidth = options?.viewportWidth ?? 1280;
        this.viewportHeight = options?.viewportHeight ?? 800;
    }
    /**
     * Captures a full-page screenshot of the given page and saves it as a baseline
     * or compares it against a previously saved baseline.
     */
    async captureAndCompare(page, pageUrl, testRunId, pageName) {
        // Ensure consistent viewport
        await page.setViewportSize({ width: this.viewportWidth, height: this.viewportHeight });
        // Wait for fonts and images to be fully rendered
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(600);
        // Capture candidate screenshot
        const candidateBuffer = await page.screenshot({
            fullPage: true,
            type: 'png',
            animations: 'disabled',
        });
        const safePageName = pageName.replace(/[^a-zA-Z0-9-_]/g, '_');
        const baselineKey = `baseline-${safePageName}`;
        const candidateKey = `candidate-${safePageName}-${testRunId}`;
        // Save candidate screenshot
        const candidateSaved = await this.vault.saveScreenshot(testRunId, candidateKey, candidateBuffer);
        // Check for existing baseline in the vault's base dir
        const baselineSubPath = path.join('baselines', 'screenshots', `${baselineKey}.png`);
        const baselineBuffer = await this.vault.getArtifact(baselineSubPath);
        if (!baselineBuffer) {
            // No baseline exists — save this as the new baseline
            await this.vault.saveScreenshot('baselines', baselineKey, candidateBuffer);
            return {
                pageName,
                pageUrl,
                capturedAt: new Date().toISOString(),
                isBaseline: true,
                baselinePath: baselineSubPath,
                candidatePath: candidateSaved.relativeUrl,
                diffPixelCount: 0,
                totalPixels: 0,
                mismatchPercentage: 0,
                isMismatch: false,
                diffSummary: 'New baseline established — no previous reference to compare against.',
            };
        }
        // Compare candidate against baseline using pixelmatch
        const result = await this.compareScreenshots(baselineBuffer, candidateBuffer, testRunId, safePageName);
        let diffSummary;
        if (!result.isMismatch) {
            diffSummary = `Visual match confirmed: ${result.mismatchPercentage.toFixed(3)}% pixel deviation (within ${this.mismatchTolerancePercent}% threshold).`;
        }
        else {
            diffSummary = `Visual regression detected: ${result.mismatchPercentage.toFixed(2)}% pixel mismatch (${result.diffPixelCount.toLocaleString()} px of ${result.totalPixels.toLocaleString()}).`;
        }
        return {
            ...result,
            pageName,
            pageUrl,
            capturedAt: new Date().toISOString(),
            isBaseline: false,
            candidatePath: candidateSaved.relativeUrl,
            diffSummary,
        };
    }
    /**
     * Compares two PNG image buffers, produces a diff image highlighting divergences,
     * and calculates the mismatch percentage against configured thresholds.
     */
    async compareScreenshots(baselineBuffer, candidateBuffer, testRunId, diffName) {
        const imgBaseline = pngjs_1.PNG.sync.read(baselineBuffer);
        const imgCandidate = pngjs_1.PNG.sync.read(candidateBuffer);
        // Normalize dimensions to the larger of the two (pad smaller with zeros)
        const width = Math.max(imgBaseline.width, imgCandidate.width);
        const height = Math.max(imgBaseline.height, imgCandidate.height);
        const adjustedBaseline = new pngjs_1.PNG({ width, height });
        pngjs_1.PNG.bitblt(imgBaseline, adjustedBaseline, 0, 0, imgBaseline.width, imgBaseline.height, 0, 0);
        const adjustedCandidate = new pngjs_1.PNG({ width, height });
        pngjs_1.PNG.bitblt(imgCandidate, adjustedCandidate, 0, 0, imgCandidate.width, imgCandidate.height, 0, 0);
        const diff = new pngjs_1.PNG({ width, height });
        const diffPixelCount = (0, pixelmatch_1.default)(adjustedBaseline.data, adjustedCandidate.data, diff.data, width, height, { threshold: this.threshold, includeAA: false });
        const totalPixels = width * height;
        const mismatchPercentage = parseFloat(((diffPixelCount / totalPixels) * 100).toFixed(4));
        const isMismatch = mismatchPercentage > this.mismatchTolerancePercent;
        let diffPath;
        if (diffPixelCount > 0) {
            const diffBuffer = pngjs_1.PNG.sync.write(diff);
            const saved = await this.vault.saveScreenshot(testRunId, `diff-${diffName}`, diffBuffer);
            diffPath = saved.relativeUrl;
        }
        return {
            baselinePath: '',
            candidatePath: '',
            diffPath,
            diffPixelCount,
            totalPixels,
            mismatchPercentage,
            isMismatch,
        };
    }
    /**
     * Resets the baseline for a specific page (next run will create a new baseline).
     */
    async resetBaseline(pageName) {
        const safePageName = pageName.replace(/[^a-zA-Z0-9-_]/g, '_');
        const baselineSubPath = path.join(this.vault.getBaseDir(), 'baselines', 'screenshots', `baseline-${safePageName}.png`);
        await fs.unlink(baselineSubPath).catch(() => { });
    }
}
exports.VisualRegressionEngine = VisualRegressionEngine;
//# sourceMappingURL=visual.js.map