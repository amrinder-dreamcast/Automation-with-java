/**
 * Unbreakable Resilience Utilities for MCP Suite
 * Prevents process crashes, retries transient failures, redacts secrets,
 * and enforces strict timeout budgets.
 */

import { MCPToolResult } from './types.js';

export interface ResilienceOptions {
  timeoutMs?: number;
  retries?: number;
  circuitBreakerThreshold?: number;
  serverName: string;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private cooldownMs: number = 30000
  ) {}

  public canExecute(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true;
  }

  public recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  public recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  public getStatus(): string {
    return this.state;
  }
}

/**
 * Redacts known sensitive keys, tokens, bearer secrets, and passwords
 */
export function redactSecrets(input: string): string {
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
export async function executeResilientTool(
  toolName: string,
  fn: () => Promise<MCPToolResult>,
  options: ResilienceOptions
): Promise<MCPToolResult> {
  const timeoutMs = options.timeoutMs ?? 30000;
  const maxRetries = options.retries ?? 1;

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new Error(`Tool '${toolName}' timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      const result = await Promise.race([fn(), timeoutPromise]);
      return result;
    } catch (err: any) {
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
        text: JSON.stringify(
          {
            status: 'ERROR',
            tool: toolName,
            server: options.serverName,
            error: safeMessage,
            timestamp: new Date().toISOString(),
            recommendation:
              'Check target URL connectivity, API credentials in .env, or verify element selectors.',
          },
          null,
          2
        ),
      },
    ],
  };
}

export function formatSuccess(data: any): MCPToolResult {
  return {
    content: [
      {
        type: 'text',
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}
