import { Page } from 'playwright';
import { InteractiveElement } from '@testpilot/core';
export interface PageExtractionResult {
    title: string;
    links: string[];
    interactiveElements: InteractiveElement[];
    hasForms: boolean;
    hasAuthTriggers: boolean;
    domHash: string;
}
/**
 * Extracts structured interactive elements, accessibility landmarks,
 * and navigation links from an active Playwright page.
 */
export declare function extractPageData(page: Page, currentUrl: string): Promise<PageExtractionResult>;
//# sourceMappingURL=dom-extractor.d.ts.map