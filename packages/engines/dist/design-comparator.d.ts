import { ArtifactVault } from '@testpilot/storage';
import { DesignComparisonResult, DesignSourceType } from '@testpilot/core';
export interface DesignCompareOptions {
    vault?: ArtifactVault;
    threshold?: number;
    defaultViewportWidth?: number;
    defaultViewportHeight?: number;
}
export interface RunDesignCompareParams {
    targetUrl: string;
    sourceType?: DesignSourceType;
    fileName?: string;
    fileBuffer?: Buffer;
    figmaUrl?: string;
    figmaToken?: string;
    adobeUrl?: string;
    designUrl?: string;
    presetId?: string;
    viewportWidth?: number;
    viewportHeight?: number;
    viewportName?: string;
    tolerance?: number;
}
export interface DesignPreset {
    id: string;
    title: string;
    category: 'FIGMA' | 'AI' | 'SKETCH' | 'XD' | 'PHOTOSHOP';
    description: string;
    defaultUrl: string;
    viewport: {
        width: number;
        height: number;
        name: string;
    };
    spec: {
        brandColor: string;
        headingFont: string;
        ctaPadding: string;
        heroSubtitle: string;
    };
}
export declare class DesignComparator {
    private vault;
    private threshold;
    private defaultViewportWidth;
    private defaultViewportHeight;
    constructor(options?: DesignCompareOptions);
    /**
     * Returns built-in benchmark design presets for instant testing.
     */
    getPresets(): DesignPreset[];
    /**
     * Main entrypoint: Compares an uploaded design file (.ai, .fig, image) or Figma URL
     * against the live rendered website at the given target URL.
     */
    compare(params: RunDesignCompareParams): Promise<DesignComparisonResult>;
    /**
     * Ingests the design source:
     * Supports:
     * 1. Figma files (.fig) -> extracts embedded thumbnails or renders frame
     * 2. Adobe Illustrator files (.ai) -> extracts PDF/raster streams or renders spec
     * 3. Image uploads (.png, .jpg, .svg, .webp) -> converts to PNG
     * 4. Figma URL -> fetches frame or falls back to smart preset
     * 5. Built-in Benchmark Presets -> renders pixel-perfect baseline PNG
     */
    private ingestDesignSource;
    /**
     * Captures live public Adobe XD prototype or spec canvas via Playwright.
     */
    private captureAdobeXdUrl;
    /**
     * Extracts embedded PNG/JPEG raster stream from an Adobe Illustrator (.ai) file,
     * or renders a high-fidelity vector representation.
     */
    private extractOrRenderAiFile;
    /**
     * Extracts embedded PNG/JPEG preview or artboard from an Adobe XD (.xd) zip package,
     * or renders the interactive Adobe XD benchmark frame.
     */
    private extractOrRenderXdFile;
    /**
     * Extracts embedded composite or preview from an Adobe Photoshop (.psd/.psb) file,
     * or renders the high-impact Photoshop benchmark frame.
     */
    private extractOrRenderPsdFile;
    /**
     * Renders Adobe PDF specification page using Playwright.
     */
    private renderPdfBuffer;
    /**
     * Extracts embedded thumbnail or preview from a Figma (.fig) archive file.
     */
    private extractOrRenderFigFile;
    /**
     * Renders SVG buffer to PNG at target dimensions using Playwright.
     */
    private renderSvgBuffer;
    /**
     * Renders raster image (JPEG, WebP) to PNG using Playwright.
     */
    private renderRasterImageBuffer;
    /**
     * Renders high-fidelity HTML/CSS benchmark design preset into a reference PNG.
     */
    private renderPresetDesign;
    /**
     * Fetches real Figma frame image from Figma REST API using Personal Access Token.
     */
    private fetchFigmaApiFrame;
    /**
     * Captures the live website with Playwright and extracts computed styles & DOM geometry.
     */
    private captureLivePage;
    /**
     * Resizes / pads both design and live PNG images so they share the exact same dimensions.
     */
    private normalizeDimensions;
    /**
     * Detects and classifies specific UI issues by correlating the pixel diff
     * and live DOM metrics with the design specifications.
     */
    private detectUiIssues;
    /**
     * Draws visual highlighting bounding boxes onto the diff PNG image
     * so the user can immediately see where UI discrepancies are located.
     */
    private drawIssueBoundingBoxes;
    private setPixel;
}
//# sourceMappingURL=design-comparator.d.ts.map