import { Page } from 'playwright';
import { SecurityFinding } from '@testpilot/core';
export declare class SecurityEngine {
    /**
     * Conducts comprehensive, safe, non-destructive passive security audits:
     * - HTTP Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
     * - Cookie attribute analysis (HttpOnly, Secure, SameSite, __Secure- prefix)
     * - Mixed Content detection
     * - Sensitive information / stack trace exposure
     * - Subresource Integrity (SRI) enforcement
     * - Dangerous inline scripts detection
     */
    auditPage(page: Page, targetUrl: string): Promise<SecurityFinding[]>;
}
//# sourceMappingURL=security.d.ts.map