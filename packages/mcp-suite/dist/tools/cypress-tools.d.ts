/**
 * Cypress Cloud MCP Toolset
 * Purpose: Debug CI failures & flaky tests. Direct agent access to CI runs, stack traces, and status.
 */
import { MCPTool, MCPToolHandler } from '../base/types.js';
export declare const cypressGetLatestRunsTool: MCPTool;
export declare const cypressGetLatestRunsHandler: MCPToolHandler;
export declare const cypressGetFlakyTestsTool: MCPTool;
export declare const cypressGetFlakyTestsHandler: MCPToolHandler;
export declare const cypressDiagnoseFailureTool: MCPTool;
export declare const cypressDiagnoseFailureHandler: MCPToolHandler;
export declare const cypressTools: {
    tool: MCPTool;
    handler: MCPToolHandler;
}[];
//# sourceMappingURL=cypress-tools.d.ts.map