#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_js_1 = require("../base/mcp-server.js");
const thunder_tools_js_1 = require("../tools/thunder-tools.js");
const server = new mcp_server_js_1.BaseMCPServer({
    name: 'thunder-mcp',
    version: '1.0.0',
    description: 'Thunder MCP: Author & manage tests in natural language without scripts',
});
for (const { tool, handler } of thunder_tools_js_1.thunderTools) {
    server.registerTool(tool, handler);
}
server.startStdio();
//# sourceMappingURL=thunder.js.map