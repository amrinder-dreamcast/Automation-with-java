"use strict";
/**
 * Unbreakable Resilience Utilities for MCP Suite
 * Prevents process crashes, retries transient failures, redacts secrets,
 * and enforces strict timeout budgets.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
exports.redactSecrets = redactSecrets;
exports.executeResilientTool = executeResilientTool;
exports.formatSuccess = formatSuccess;
class CircuitBreaker {
    threshold;
    cooldownMs;
    failures = 0;
    lastFailureTime = 0;
    state = 'CLOSED';
    constructor(threshold = 5, cooldownMs = 30000) {
        this.threshold = threshold;
        this.cooldownMs = cooldownMs;
    }
    canExecute() {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.cooldownMs) {
                this.state = 'HALF_OPEN';
                return true;
            }
            return false;
        }
        return true;
    }
    recordSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    }
    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
        }
    }
    getStatus() {
        return this.state;
    }
}
exports.CircuitBreaker = CircuitBreaker;
/**
 * Redacts known sensitive keys, tokens, bearer secrets, and passwords
 */
function redactSecrets(input) {
    return input
        .replace(/(bearer\s+)[A-Za-z0-9_\-\.]{15,}/gi, '$1[REDACTED_TOKEN]')
        .replace(/(api[_-]?key["':\s=]+)[A-Za-z0-9_\-]{15,}/gi, '$1[REDACTED_API_KEY]')
        .replace(/(password["':\s=]+)[^,\s"}]+/gi, '$1[REDACTED_PASSWORD]')
        .replace(/(access[_-]?key["':\s=]+)[A-Za-z0-9_\-]{15,}/gi, '$1[REDACTED_KEY]')
        .replace(/(secret["':\s=]+)[A-Za-z0-9_\-]{15,}/gi, '$1[REDACTED_SECRET]');
}
/**
 * Unbreakable wrapper for executing MCP tool handlers safely.
 * Will NEVER throw an unhandled rejection, always returns formatted MCPToolResult.
 */
async function executeResilientTool(toolName, fn, options) {
    const timeoutMs = options.timeoutMs ?? 30000;
    const maxRetries = options.retries ?? 1;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const timeoutPromise = new Promise((_, reject) => {
                const id = setTimeout(() => {
                    clearTimeout(id);
                    reject(new Error(`Tool '${toolName}' timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            });
            const result = await Promise.race([fn(), timeoutPromise]);
            return result;
        }
        catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                // Wait before retry
                await new Promise((resolve) => setTimeout(resolve, attempt * 250));
            }
        }
    }
    // Graceful Unbreakable Error Response
    const safeMessage = redactSecrets(lastError?.message || String(lastError));
    return {
        isError: true,
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    status: 'ERROR',
                    tool: toolName,
                    server: options.serverName,
                    error: safeMessage,
                    timestamp: new Date().toISOString(),
                    recommendation: 'Check target URL connectivity, API credentials in .env, or verify element selectors.',
                }, null, 2),
            },
        ],
    };
}
function formatSuccess(data) {
    return {
        content: [
            {
                type: 'text',
                text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=resilience.js.map