"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPageData = extractPageData;
/**
 * Extracts structured interactive elements, accessibility landmarks,
 * and navigation links from an active Playwright page.
 */
async function extractPageData(page, currentUrl) {
    return await page.evaluate((url) => {
        const interactiveElements = [];
        const discoveredLinks = new Set();
        let hasForms = false;
        let hasAuthTriggers = false;
        // Helper to generate a robust CSS selector
        function generateSelector(el) {
            if (el.id) {
                return `#${CSS.escape(el.id)}`;
            }
            const testId = el.getAttribute('data-testid') || el.getAttribute('data-test');
            if (testId) {
                return `[data-testid="${CSS.escape(testId)}"]`;
            }
            const role = el.getAttribute('role');
            const ariaLabel = el.getAttribute('aria-label');
            if (role && ariaLabel) {
                return `[role="${CSS.escape(role)}"][aria-label="${CSS.escape(ariaLabel)}"]`;
            }
            if (ariaLabel) {
                return `[aria-label="${CSS.escape(ariaLabel)}"]`;
            }
            const name = el.getAttribute('name');
            if (name) {
                return `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;
            }
            // Fallback: Path with nth-of-type
            const path = [];
            let curr = el;
            while (curr && curr.nodeType === Node.ELEMENT_NODE && curr !== document.body && curr !== document.documentElement) {
                let seg = curr.tagName.toLowerCase();
                if (curr.id) {
                    seg = `#${CSS.escape(curr.id)}`;
                    path.unshift(seg);
                    break;
                }
                let siblingIndex = 1;
                let sibling = curr.previousElementSibling;
                while (sibling) {
                    if (sibling.tagName === curr.tagName)
                        siblingIndex++;
                    sibling = sibling.previousElementSibling;
                }
                seg += `:nth-of-type(${siblingIndex})`;
                path.unshift(seg);
                curr = curr.parentElement;
            }
            return path.join(' > ');
        }
        // 1. Collect all links
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        for (const a of anchors) {
            const href = a.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
                try {
                    const resolved = new URL(href, url).href;
                    discoveredLinks.add(resolved);
                }
                catch {
                    // ignore invalid URLs
                }
            }
        }
        // 2. Scan interactive components: buttons, inputs, links, forms
        const candidates = Array.from(document.querySelectorAll('button, [role="button"], input, select, textarea, a[href], form, [role="dialog"], [role="tab"]'));
        let elementIndex = 0;
        for (const el of candidates) {
            elementIndex++;
            const tagName = el.tagName.toLowerCase();
            const role = el.getAttribute('role');
            const text = (el.innerText || el.textContent || '').trim().slice(0, 100);
            const isInput = tagName === 'input' || tagName === 'select' || tagName === 'textarea';
            const isClickable = tagName === 'button' || role === 'button' || tagName === 'a' || el.type === 'submit';
            if (tagName === 'form') {
                hasForms = true;
            }
            const inputType = el.type;
            if (inputType === 'password' || text.toLowerCase().includes('login') || text.toLowerCase().includes('sign in')) {
                hasAuthTriggers = true;
            }
            const rect = el.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
            if (isVisible) {
                interactiveElements.push({
                    id: `elem-${elementIndex}`,
                    pageUrl: url,
                    tagName,
                    role,
                    name: el.getAttribute('name') || el.getAttribute('aria-label') || text || null,
                    selector: generateSelector(el),
                    text: text || undefined,
                    isClickable,
                    isInput,
                    inputType: inputType || undefined,
                    formId: el.form?.id || undefined,
                    location: {
                        x: Math.round(rect.x),
                        y: Math.round(rect.y),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                    },
                });
            }
        }
        // 3. Compute structural DOM fingerprint
        const domSkeleton = candidates.map((c) => `${c.tagName}:${c.getAttribute('role') || ''}`).join('|');
        let hash = 0;
        for (let i = 0; i < domSkeleton.length; i++) {
            hash = (hash << 5) - hash + domSkeleton.charCodeAt(i);
            hash |= 0;
        }
        return {
            title: document.title,
            links: Array.from(discoveredLinks),
            interactiveElements,
            hasForms,
            hasAuthTriggers,
            domHash: `dom_${Math.abs(hash).toString(16)}`,
        };
    }, currentUrl);
}
//# sourceMappingURL=dom-extractor.js.map