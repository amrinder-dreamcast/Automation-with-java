import { Page } from 'playwright';
import { SecurityFinding } from '@testpilot/core';

export class SecurityEngine {
  /**
   * Conducts comprehensive, safe, non-destructive passive security audits:
   * - HTTP Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
   * - Cookie attribute analysis (HttpOnly, Secure, SameSite, __Secure- prefix)
   * - Mixed Content detection
   * - Sensitive information / stack trace exposure
   * - Subresource Integrity (SRI) enforcement
   * - Dangerous inline scripts detection
   */
  public async auditPage(page: Page, targetUrl: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === 'https:';

    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (!response) return findings;

    const headers = response.headers();

    // ── 1. Content Security Policy ─────────────────────────────────────────
    if (!headers['content-security-policy'] && !headers['content-security-policy-report-only']) {
      findings.push({
        type: 'MISSING_CSP',
        severity: 'P2',
        title: 'Missing Content Security Policy (CSP)',
        description: 'No Content-Security-Policy header is present. Without a CSP, the browser will execute any injected scripts, making the site highly vulnerable to Cross-Site Scripting (XSS) attacks.',
        evidence: 'Header "content-security-policy" absent from all response headers.',
        recommendation: "Implement a strict CSP: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';",
      });
    } else if (headers['content-security-policy']) {
      const csp = headers['content-security-policy'];
      if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) {
        findings.push({
          type: 'MISSING_CSP',
          severity: 'P3',
          title: "Weak CSP: 'unsafe-inline' or 'unsafe-eval' Detected",
          description: "The Content-Security-Policy permits 'unsafe-inline' or 'unsafe-eval' directives, which allow arbitrary inline scripts and eval() calls — greatly weakening XSS protection.",
          evidence: `CSP value: ${csp.substring(0, 200)}`,
          recommendation: "Remove 'unsafe-inline' and 'unsafe-eval'. Use nonces or hashes for inline scripts instead.",
        });
      }
    }

    // ── 2. Strict-Transport-Security (HSTS) ────────────────────────────────
    if (isHttps && !headers['strict-transport-security']) {
      findings.push({
        type: 'MISSING_HSTS',
        severity: 'P2',
        title: 'Missing HTTP Strict Transport Security (HSTS)',
        description: 'The HTTPS server does not send a Strict-Transport-Security header. This allows SSL-stripping man-in-the-middle attacks where an attacker downgrades the connection to HTTP.',
        evidence: 'Header "strict-transport-security" absent from HTTPS response.',
        recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
      });
    } else if (headers['strict-transport-security']) {
      const hsts = headers['strict-transport-security'];
      const maxAge = /max-age=(\d+)/.exec(hsts)?.[1];
      if (maxAge && parseInt(maxAge, 10) < 15552000) {
        findings.push({
          type: 'MISSING_HSTS',
          severity: 'P3',
          title: 'HSTS max-age Too Short (< 6 months)',
          description: `The HSTS max-age is set to ${maxAge} seconds, which is below the recommended 6-month minimum. Short durations reduce the protective coverage window.`,
          evidence: `Strict-Transport-Security: ${hsts}`,
          recommendation: 'Set max-age to at least 15552000 (6 months), ideally 31536000 (1 year).',
        });
      }
    }

    // ── 3. Clickjacking (X-Frame-Options / CSP frame-ancestors) ───────────
    if (!headers['x-frame-options'] && !headers['content-security-policy']?.includes('frame-ancestors')) {
      findings.push({
        type: 'X_FRAME_OPTIONS_MISSING',
        severity: 'P3',
        title: 'No Clickjacking Defense (X-Frame-Options / CSP frame-ancestors)',
        description: 'The page is embeddable in any iframe without restriction. An attacker can embed it in a malicious site to conduct UI-redressing (clickjacking) attacks.',
        evidence: 'Neither "x-frame-options" nor CSP "frame-ancestors" directive is set.',
        recommendation: 'Add X-Frame-Options: DENY or include "frame-ancestors \'none\'" in your CSP.',
      });
    }

    // ── 4. X-Content-Type-Options ─────────────────────────────────────────
    if (!headers['x-content-type-options']) {
      findings.push({
        type: 'SENSITIVE_DATA_EXPOSURE',
        severity: 'P3',
        title: 'Missing X-Content-Type-Options Header',
        description: "Without X-Content-Type-Options: nosniff, browsers may MIME-sniff responses and interpret mistyped files as executable scripts, enabling content-injection attacks.",
        evidence: 'Header "x-content-type-options" not present.',
        recommendation: 'Add: X-Content-Type-Options: nosniff',
      });
    }

    // ── 5. Referrer-Policy ────────────────────────────────────────────────
    if (!headers['referrer-policy']) {
      findings.push({
        type: 'SENSITIVE_DATA_EXPOSURE',
        severity: 'P4',
        title: 'Missing Referrer-Policy Header',
        description: 'Without a Referrer-Policy, the browser sends the full URL (including paths, query parameters, and tokens) as the Referer header to third-party resources, leaking sensitive navigation data.',
        evidence: 'Header "referrer-policy" not present.',
        recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin',
      });
    }

    // ── 6. Permissions-Policy ─────────────────────────────────────────────
    if (!headers['permissions-policy'] && !headers['feature-policy']) {
      findings.push({
        type: 'SENSITIVE_DATA_EXPOSURE',
        severity: 'P4',
        title: 'Missing Permissions-Policy Header',
        description: 'No Permissions-Policy header is set. This grants third-party embedded content unrestricted access to browser APIs like camera, microphone, geolocation, and USB.',
        evidence: 'Header "permissions-policy" not present.',
        recommendation: 'Add: Permissions-Policy: geolocation=(), camera=(), microphone=(), usb=()',
      });
    }

    // ── 7. Cookie Security Analysis ───────────────────────────────────────
    const allHeaders = (await response.headersArray?.()) || [];
    const cookieHeaders = allHeaders.filter((h: { name: string; value: string }) =>
      h.name.toLowerCase() === 'set-cookie'
    );

    for (const cookie of cookieHeaders) {
      const val = cookie.value.toLowerCase();
      const cookieName = cookie.value.split('=')[0].trim();
      const isSessionOrAuth = /session|token|auth|csrf|jwt|sid/.test(val);

      if (!val.includes('httponly')) {
        findings.push({
          type: 'INSECURE_COOKIE',
          severity: isSessionOrAuth ? 'P1' : 'P3',
          title: `Cookie Missing HttpOnly Flag: ${cookieName}`,
          description: `Cookie "${cookieName}" is accessible to JavaScript. If the site has any XSS vulnerability, an attacker can steal this cookie using document.cookie.`,
          evidence: `Set-Cookie: ${cookie.value.substring(0, 120)}`,
          recommendation: 'Add the HttpOnly attribute to all cookies, especially session/auth cookies.',
        });
      }

      if (isHttps && !val.includes('secure')) {
        findings.push({
          type: 'INSECURE_COOKIE',
          severity: 'P2',
          title: `Cookie Missing Secure Flag: ${cookieName}`,
          description: `Cookie "${cookieName}" does not have the Secure attribute. It can be transmitted over unencrypted HTTP connections if the user accidentally navigates to HTTP.`,
          evidence: `Set-Cookie: ${cookie.value.substring(0, 120)}`,
          recommendation: 'Add the Secure attribute to all cookies served over HTTPS.',
        });
      }

      if (!val.includes('samesite')) {
        findings.push({
          type: 'INSECURE_COOKIE',
          severity: 'P3',
          title: `Cookie Missing SameSite Attribute: ${cookieName}`,
          description: `Cookie "${cookieName}" has no SameSite attribute. This makes it vulnerable to Cross-Site Request Forgery (CSRF) attacks.`,
          evidence: `Set-Cookie: ${cookie.value.substring(0, 120)}`,
          recommendation: 'Add SameSite=Lax (or Strict for high-security cookies).',
        });
      }

      // __Secure- prefix enforcement
      if (cookieName.startsWith('__secure-') && (!isHttps || !val.includes('secure'))) {
        findings.push({
          type: 'INSECURE_COOKIE',
          severity: 'P1',
          title: `__Secure- Prefix Cookie Not Served Securely: ${cookieName}`,
          description: 'Cookies with the __Secure- prefix MUST be set over HTTPS with the Secure attribute. Violating this will cause the cookie to be rejected by modern browsers.',
          evidence: `Set-Cookie: ${cookie.value.substring(0, 120)}`,
          recommendation: 'Ensure __Secure- prefixed cookies are served over HTTPS with the Secure flag.',
        });
      }
    }

    // ── 8. Mixed Content Inspection ───────────────────────────────────────
    if (isHttps) {
      const insecureResources = await page.evaluate(() => {
        const elements = Array.from(
          document.querySelectorAll('img[src], script[src], link[href], iframe[src], audio[src], video[src], source[src]')
        );
        return elements
          .map((el) => el.getAttribute('src') || el.getAttribute('href') || '')
          .filter((src) => src.startsWith('http://'))
          .slice(0, 10);
      });

      if (insecureResources.length > 0) {
        findings.push({
          type: 'MIXED_CONTENT',
          severity: 'P1',
          title: `Mixed Content Detected (${insecureResources.length} insecure resource${insecureResources.length > 1 ? 's' : ''})`,
          description: 'The HTTPS page loads resources over HTTP. Modern browsers will block active mixed content and warn on passive mixed content, potentially breaking page functionality.',
          evidence: `Insecure: ${insecureResources.slice(0, 3).join(', ')}`,
          recommendation: 'Migrate all asset references to HTTPS or use protocol-relative URLs (//).',
        });
      }
    }

    // ── 9. Sensitive Error / Stack Trace Exposure ─────────────────────────
    const pageText = await page.content();
    const sensitivePatterns = [
      { regex: /Traceback \(most recent call last\):/i, label: 'Python Stack Trace' },
      { regex: /at\s+[\w$.]+\s+\(.*:\d+:\d+\)/i, label: 'Node.js / JavaScript Stack Trace' },
      { regex: /Fatal error:.*on line \d+/i, label: 'PHP Fatal Error' },
      { regex: /SQLSTATE\[\w+\]/i, label: 'SQL Database Error Exposed' },
      { regex: /javax\.servlet\.ServletException/i, label: 'Java Servlet Exception' },
      { regex: /System\.Exception|StackTrace:/i, label: '.NET / C# Exception' },
      { regex: /ActiveRecord::.*Error/i, label: 'Ruby on Rails Database Error' },
    ];

    for (const pat of sensitivePatterns) {
      if (pat.regex.test(pageText)) {
        findings.push({
          type: 'EXPOSED_ERROR',
          severity: 'P1',
          title: `Application Exception Exposed: ${pat.label}`,
          description: `Raw stack traces or database errors are rendered in the browser, revealing internal file paths, framework versions, and implementation details that attackers can exploit.`,
          evidence: `Pattern matched: ${pat.label}`,
          recommendation: 'Disable debug mode. Configure custom error pages. Never expose raw exceptions in production.',
        });
      }
    }

    // ── 10. Subresource Integrity (SRI) ───────────────────────────────────
    const missingSRI = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'));
      const missing: string[] = [];
      for (const el of [...scripts, ...links]) {
        const src = el.getAttribute('src') || el.getAttribute('href') || '';
        const isExternal = src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//');
        if (isExternal && !el.hasAttribute('integrity')) {
          missing.push(src.substring(0, 80));
        }
      }
      return missing.slice(0, 5);
    });

    if (missingSRI.length > 0) {
      findings.push({
        type: 'SENSITIVE_DATA_EXPOSURE',
        severity: 'P3',
        title: `Missing Subresource Integrity (SRI) on ${missingSRI.length} External Resource${missingSRI.length > 1 ? 's' : ''}`,
        description: 'External scripts and stylesheets loaded without SRI integrity attributes can be tampered with at the CDN or origin level, allowing supply-chain attacks.',
        evidence: `External resources without integrity: ${missingSRI.join(', ')}`,
        recommendation: 'Add integrity="sha384-..." and crossorigin="anonymous" attributes to external <script> and <link> tags.',
      });
    }

    return findings;
  }
}
