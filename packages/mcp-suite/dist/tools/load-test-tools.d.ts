/**
 * Grafana k6 & OctoPerf Load Testing MCP Toolset
 * Purpose: Run load & performance tests. Write, validate, and run load tests without leaving the editor.
 */
import { MCPTool, MCPToolHandler } from '../base/types.js';
export declare const k6RunLoadTestTool: MCPTool;
export declare const k6RunLoadTestHandler: MCPToolHandler;
export declare const k6ValidateScriptTool: MCPTool;
export declare const k6ValidateScriptHandler: MCPToolHandler;
export declare const octoperfGenerateScenarioTool: MCPTool;
export declare const octoperfGenerateScenarioHandler: MCPToolHandler;
export declare const loadTestTools: {
    tool: MCPTool;
    handler: MCPToolHandler;
}[];
//# sourceMappingURL=load-test-tools.d.ts.map