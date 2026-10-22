import { CrawlSession, TargetScope } from '@testpilot/core';
import { ArtifactVault } from '@testpilot/storage';
export interface CrawlProgressEvent {
    phase: 'NAVIGATING' | 'EXTRACTING' | 'PAGE_DISCOVERED' | 'BROKEN_LINK_FOUND';
    url: string;
    depth: number;
    pagesCrawled: number;
    queueLength: number;
    message?: string;
}
export interface CrawlerOptions {
    vault?: ArtifactVault;
    headless?: boolean;
    onProgress?: (event: CrawlProgressEvent) => void;
}
export declare class SafeCrawler {
    private scope;
    private vault;
    private headless;
    private onProgress?;
    constructor(scope: TargetScope, options?: CrawlerOptions);
    private normalizeUrl;
    crawl(sessionId: string): Promise<CrawlSession>;
}
//# sourceMappingURL=crawler.d.ts.map