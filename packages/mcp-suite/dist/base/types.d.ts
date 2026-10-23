/**
 * Model Context Protocol (MCP) Standard Type Definitions
 * Specification: 2024-11-05
 */
export interface MCPToolInputSchema {
    type: 'object';
    properties: Record<string, {
        type: string;
        description?: string;
        enum?: string[];
        items?: {
            type: string;
        };
        default?: any;
    }>;
    required?: string[];
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: MCPToolInputSchema;
}
export interface MCPContentItem {
    type: 'text';
    text: string;
}
export interface MCPToolResult {
    content: MCPContentItem[];
    isError?: boolean;
}
export type MCPToolHandler = (args: Record<string, any>) => Promise<MCPToolResult>;
export interface JSONRPCRequest {
    jsonrpc: '2.0';
    id?: string | number;
    method: string;
    params?: Record<string, any>;
}
export interface JSONRPCResponse {
    jsonrpc: '2.0';
    id?: string | number | null;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}
export interface ServerInfo {
    name: string;
    version: string;
    description?: string;
}
//# sourceMappingURL=types.d.ts.map