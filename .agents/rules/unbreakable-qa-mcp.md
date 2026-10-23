# Unbreakable QA MCP System Rules & Guardrails

These rules govern the autonomous execution of QA tools, MCP servers, and test agents across this repository.

## 1. Zero-Crash Error Boundary Standard
- Every MCP tool handler MUST wrap execution in try-catch error boundaries.
- If an external cloud service (e.g. BrowserStack, Cypress Cloud, ReportPortal) does not have API keys configured in `.env`, the tool MUST return structured diagnostic guidance and local fallback telemetry rather than throwing an unhandled rejection.
- Standard JSON-RPC 2.0 messages MUST be strictly framed on `stdout`. Any debugging or diagnostic logs MUST be routed exclusively to `stderr`.

## 2. SSRF Protection & Target Safety
- Before dispatching load tests (`k6_run_load_test`) or browser navigations (`playwright_navigate`, `vibium_execute_action`), ensure the URL does not target AWS/GCP metadata endpoints (`169.254.169.254`, `metadata.google.internal`) or unauthorized private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) unless testing local fixtures explicitly (`TESTPILOT_ALLOW_LOCAL_TARGETS=true`).

## 3. Secret & Credential Sanitization
- Bearer tokens, API keys, password strings, and AWS/GCP credentials MUST be redacted before persisting artifacts or returning MCP content.
- Use the built-in `redactSecrets()` utility on all test traces, DOM snapshots, and console logs.

## 4. Concurrency & Timeout Budgets
- Browser navigations MUST be capped at 30,000ms.
- DOM and AX tree extractions MUST be capped at 10,000ms.
- k6 load tests MUST default to <= 30 seconds unless explicitly overridden.
- Maximum concurrent headless browser contexts: 2 per node worker.

## 5. Self-Healing Selector Precedence
When identifying or interacting with DOM elements, prioritize locators in this exact order:
1. **Semantic Role & Accessible Name**: `getByRole('button', { name: 'Submit' })`
2. **Standard ARIA Attributes**: `aria-label`, `aria-labelledby`
3. **Dedicated Test IDs**: `data-testid`, `data-qa`
4. **Normalized Text Content**: `text="Get Started"`
5. **CSS Structure**: Avoid fragile generated hashes (e.g. `.sc-bxivhb`, `.css-19z4n4`).
