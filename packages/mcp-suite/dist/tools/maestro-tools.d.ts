/**
 * Maestro MCP Toolset
 * Purpose: Test mobile apps (iOS/Android). Agent writes, runs, and debugs mobile tests against live emulators.
 */
import { MCPTool, MCPToolHandler } from '../base/types.js';
export interface MaestroCommand {
    action: 'launchApp' | 'tapOn' | 'inputText' | 'assertVisible' | 'assertNotVisible' | 'scroll' | 'back' | 'waitForAnimationToEnd';
    target?: string;
    point?: {
        x: number;
        y: number;
    };
    text?: string;
    id?: string;
    timeout?: number;
}
export declare const maestroAuthorFlowTool: MCPTool;
export declare const maestroAuthorFlowHandler: MCPToolHandler;
export declare const maestroRunFlowTool: MCPTool;
export declare const maestroRunFlowHandler: MCPToolHandler;
export declare const maestroInspectHierarchyTool: MCPTool;
export declare const maestroInspectHierarchyHandler: MCPToolHandler;
export declare const maestroTools: {
    tool: MCPTool;
    handler: MCPToolHandler;
}[];
//# sourceMappingURL=maestro-tools.d.ts.map