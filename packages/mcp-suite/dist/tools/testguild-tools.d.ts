/**
 * TestGuild Tool Matcher MCP Toolset
 * Purpose: Figure out which tool to use. Queries a curated database of 300+ QA tools to recommend a stack.
 */
import { MCPTool, MCPToolHandler } from '../base/types.js';
export interface QATool {
    id: string;
    name: string;
    category: 'web_automation' | 'mobile_automation' | 'load_performance' | 'accessibility' | 'visual_testing' | 'test_management' | 'api_testing' | 'security';
    primaryLanguages: string[];
    pricingTier: 'open_source' | 'freemium' | 'commercial' | 'enterprise';
    mcpReady: boolean;
    bestFor: string;
    strengths: string[];
    tradeoffs: string[];
    starsOrPopularity: string;
}
export declare const testguildRecommendStackTool: MCPTool;
export declare const testguildRecommendStackHandler: MCPToolHandler;
export declare const testguildSearchToolsTool: MCPTool;
export declare const testguildSearchToolsHandler: MCPToolHandler;
export declare const testguildCompareToolsTool: MCPTool;
export declare const testguildCompareToolsHandler: MCPToolHandler;
export declare const testguildTools: {
    tool: MCPTool;
    handler: MCPToolHandler;
}[];
//# sourceMappingURL=testguild-tools.d.ts.map