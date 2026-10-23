/**
 * High-Performance, Unbreakable Base MCP Server (JSON-RPC 2.0 / stdio)
 */

import * as readline from 'node:readline';
import {
  MCPTool,
  MCPToolHandler,
  MCPToolResult,
  JSONRPCRequest,
  JSONRPCResponse,
  ServerInfo,
} from './types.js';
import { executeResilientTool, formatSuccess } from './resilience.js';

export class BaseMCPServer {
  protected tools = new Map<string, { tool: MCPTool; handler: MCPToolHandler }>();
  protected serverInfo: ServerInfo;
  protected isInitialized = false;

  constructor(serverInfo: ServerInfo) {
    this.serverInfo = serverInfo;
  }

  public registerTool(tool: MCPTool, handler: MCPToolHandler): void {
    this.tools.set(tool.name, { tool, handler });
  }

  public getRegisteredTools(): MCPTool[] {
    return Array.from(this.tools.values()).map((t) => t.tool);
  }

  public async executeToolDirect(
    toolName: string,
    args: Record<string, any>
  ): Promise<MCPToolResult> {
    const entry = this.tools.get(toolName);
    if (!entry) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Tool '${toolName}' not found in server '${this.serverInfo.name}'`,
          },
        ],
      };
    }

    return executeResilientTool(
      toolName,
      () => entry.handler(args),
      { serverName: this.serverInfo.name }
    );
  }

  public handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse | null> {
    return new Promise(async (resolve) => {
      try {
        const { method, id, params } = request;

        if (method === 'initialize') {
          this.isInitialized = true;
          return resolve({
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {
                  listChanged: false,
                },
              },
              serverInfo: {
                name: this.serverInfo.name,
                version: this.serverInfo.version,
              },
            },
          });
        }

        if (method === 'notifications/initialized') {
          // Client notification, no response required
          return resolve(null);
        }

        if (method === 'ping') {
          return resolve({
            jsonrpc: '2.0',
            id,
            result: {},
          });
        }

        if (method === 'tools/list') {
          const toolList = this.getRegisteredTools();
          return resolve({
            jsonrpc: '2.0',
            id,
            result: {
              tools: toolList,
            },
          });
        }

        if (method === 'tools/call') {
          const toolName = params?.name;
          const toolArgs = params?.arguments || {};
          const result = await this.executeToolDirect(toolName, toolArgs);

          return resolve({
            jsonrpc: '2.0',
            id,
            result,
          });
        }

        // Unknown method
        return resolve({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        });
      } catch (err: any) {
        return resolve({
          jsonrpc: '2.0',
          id: request.id ?? null,
          error: {
            code: -32603,
            message: `Internal error: ${err?.message || err}`,
          },
        });
      }
    });
  }

  /**
   * Starts listening on process.stdin and sending responses to process.stdout.
   * Redirects console.log to stderr to prevent breaking the MCP protocol JSON framing.
   */
  public startStdio(): void {
    // Redirect console logs to stderr
    const originalConsoleLog = console.log;
    console.log = (...args: any[]) => {
      process.stderr.write(`[${this.serverInfo.name}] ${args.join(' ')}\n`);
    };

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on('line', async (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const parsed = JSON.parse(trimmed) as JSONRPCRequest;
        const response = await this.handleRequest(parsed);
        if (response) {
          process.stdout.write(JSON.stringify(response) + '\n');
        }
      } catch (err: any) {
        // Syntax error in JSON-RPC request
        const errResp: JSONRPCResponse = {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: `Parse error: ${err?.message || 'Invalid JSON'}`,
          },
        };
        process.stdout.write(JSON.stringify(errResp) + '\n');
      }
    });

    process.on('SIGTERM', () => process.exit(0));
    process.on('SIGINT', () => process.exit(0));

    process.stderr.write(
      `[${this.serverInfo.name}] MCP Server running on stdio (v${this.serverInfo.version})\n`
    );
  }
}
