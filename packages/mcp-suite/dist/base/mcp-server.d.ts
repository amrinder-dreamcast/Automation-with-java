/**
 * High-Performance, Unbreakable Base MCP Server (JSON-RPC 2.0 / stdio)
 */
import { MCPTool, MCPToolHandler, MCPToolResult, JSONRPCRequest, JSONRPCResponse, ServerInfo } from './types.js';
export declare class BaseMCPServer {
    protected tools: Map<string, {
        tool: MCPTool;
        handler: MCPToolHandler;
    }>;
    protected serverInfo: ServerInfo;
    protected isInitialized: boolean;
    constructor(serverInfo: ServerInfo);
    registerTool(tool: MCPTool, handler: MCPToolHandler): void;
    getRegisteredTools(): MCPTool[];
    executeToolDirect(toolName: string, args: Record<string, any>): Promise<MCPToolResult>;
    handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse | null>;
    /**
     * Starts listening on process.stdin and sending responses to process.stdout.
     * Redirects console.log to stderr to prevent breaking the MCP protocol JSON framing.
     */
    startStdio(): void;
}
//# sourceMappingURL=mcp-server.d.ts.map