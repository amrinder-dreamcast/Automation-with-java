import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { Page } from 'playwright';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { VisualDiffResult } from '@testpilot/core';
import { ArtifactVault } from '@testpilot/storage';

export interface VisualEngineOptions {
  vault?: ArtifactVault;
  threshold?: number;                 // 0–1 per-pixel sensitivity, default 0.1
  mismatchTolerancePercent?: number;  // acceptable mismatch %, default 0.5
  viewportWidth?: number;
  viewportHeight?: number;
}

export interface VisualTestResult extends VisualDiffResult {
  pageName: string;
  pageUrl: string;
  capturedAt: string;
  isBaseline: boolean;
  diffSummary?: string;
}

export class VisualRegressionEngine {
  private vault: ArtifactVault;
  private threshold: number;
  private mismatchTolerancePercent: number;
  private viewportWidth: number;
  private viewportHeight: number;

  constructor(options?: VisualEngineOptions) {
    this.vault = options?.vault || new ArtifactVault();
    this.threshold = options?.threshold ?? 0.1;
    this.mismatchTolerancePercent = options?.mismatchTolerancePercent ?? 0.5;
    this.viewportWidth = options?.viewportWidth ?? 1280;
    this.viewportHeight = options?.viewportHeight ?? 800;
  }

  /**
   * Captures a full-page screenshot of the given page and saves it as a baseline
   * or compares it against a previously saved baseline.
   */
  public async captureAndCompare(
    page: Page,
    pageUrl: string,
    testRunId: string,
    pageName: string
  ): Promise<VisualTestResult> {
    // Ensure consistent viewport
    await page.setViewportSize({ width: this.viewportWidth, height: this.viewportHeight });

    // Wait for fonts and images to be fully rendered
    await page.waitForLoadState('networkidle').catch(() => {});
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

    let diffSummary: string;
    if (!result.isMismatch) {
      diffSummary = `Visual match confirmed: ${result.mismatchPercentage.toFixed(3)}% pixel deviation (within ${this.mismatchTolerancePercent}% threshold).`;
    } else {
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
  public async compareScreenshots(
    baselineBuffer: Buffer,
    candidateBuffer: Buffer,
    testRunId: string,
    diffName: string
  ): Promise<VisualDiffResult> {
    const imgBaseline = PNG.sync.read(baselineBuffer);
    const imgCandidate = PNG.sync.read(candidateBuffer);

    // Normalize dimensions to the larger of the two (pad smaller with zeros)
    const width = Math.max(imgBaseline.width, imgCandidate.width);
    const height = Math.max(imgBaseline.height, imgCandidate.height);

    const adjustedBaseline = new PNG({ width, height });
    PNG.bitblt(imgBaseline, adjustedBaseline, 0, 0, imgBaseline.width, imgBaseline.height, 0, 0);

    const adjustedCandidate = new PNG({ width, height });
    PNG.bitblt(imgCandidate, adjustedCandidate, 0, 0, imgCandidate.width, imgCandidate.height, 0, 0);

    const diff = new PNG({ width, height });

    const diffPixelCount = pixelmatch(
      adjustedBaseline.data,
      adjustedCandidate.data,
      diff.data,
      width,
      height,
      { threshold: this.threshold, includeAA: false }
    );

    const totalPixels = width * height;
    const mismatchPercentage = parseFloat(((diffPixelCount / totalPixels) * 100).toFixed(4));
    const isMismatch = mismatchPercentage > this.mismatchTolerancePercent;

    let diffPath: string | undefined;
    if (diffPixelCount > 0) {
      const diffBuffer = PNG.sync.write(diff);
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
  public async resetBaseline(pageName: string): Promise<void> {
    const safePageName = pageName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const baselineSubPath = path.join(this.vault.getBaseDir(), 'baselines', 'screenshots', `baseline-${safePageName}.png`);
    await fs.unlink(baselineSubPath).catch(() => {});
  }
}
