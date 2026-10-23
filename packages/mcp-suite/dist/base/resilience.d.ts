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
export declare class CircuitBreaker {
    private threshold;
    private cooldownMs;
    private failures;
    private lastFailureTime;
    private state;
    constructor(threshold?: number, cooldownMs?: number);
    canExecute(): boolean;
    recordSuccess(): void;
    recordFailure(): void;
    getStatus(): string;
}
/**
 * Redacts known sensitive keys, tokens, bearer secrets, and passwords
 */
export declare function redactSecrets(input: string): string;
/**
 * Unbreakable wrapper for executing MCP tool handlers safely.
 * Will NEVER throw an unhandled rejection, always returns formatted MCPToolResult.
 */
export declare function executeResilientTool(toolName: string, fn: () => Promise<MCPToolResult>, options: ResilienceOptions): Promise<MCPToolResult>;
export declare function formatSuccess(data: any): MCPToolResult;
//# sourceMappingURL=resilience.d.ts.map