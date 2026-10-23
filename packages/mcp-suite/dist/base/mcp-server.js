"use strict";
/**
 * High-Performance, Unbreakable Base MCP Server (JSON-RPC 2.0 / stdio)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMCPServer = void 0;
const readline = __importStar(require("node:readline"));
const resilience_js_1 = require("./resilience.js");
class BaseMCPServer {
    tools = new Map();
    serverInfo;
    isInitialized = false;
    constructor(serverInfo) {
        this.serverInfo = serverInfo;
    }
    registerTool(tool, handler) {
        this.tools.set(tool.name, { tool, handler });
    }
    getRegisteredTools() {
        return Array.from(this.tools.values()).map((t) => t.tool);
    }
    async executeToolDirect(toolName, args) {
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
        return (0, resilience_js_1.executeResilientTool)(toolName, () => entry.handler(args), { serverName: this.serverInfo.name });
    }
    handleRequest(request) {
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
            }
            catch (err) {
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
    startStdio() {
        // Redirect console logs to stderr
        const originalConsoleLog = console.log;
        console.log = (...args) => {
            process.stderr.write(`[${this.serverInfo.name}] ${args.join(' ')}\n`);
        };
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });
        rl.on('line', async (line) => {
            const trimmed = line.trim();
            if (!trimmed)
                return;
            try {
                const parsed = JSON.parse(trimmed);
                const response = await this.handleRequest(parsed);
                if (response) {
                    process.stdout.write(JSON.stringify(response) + '\n');
                }
            }
            catch (err) {
                // Syntax error in JSON-RPC request
                const errResp = {
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
        process.stderr.write(`[${this.serverInfo.name}] MCP Server running on stdio (v${this.serverInfo.version})\n`);
    }
}
exports.BaseMCPServer = BaseMCPServer;
//# sourceMappingURL=mcp-server.js.map