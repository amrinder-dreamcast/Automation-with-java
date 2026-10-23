#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_js_1 = require("../base/mcp-server.js");
const accessibility_tools_js_1 = require("../tools/accessibility-tools.js");
const server = new mcp_server_js_1.BaseMCPServer({
    name: 'accessibility-scanner-mcp',
    version: '1.0.0',
    description: 'MCP Accessibility Scanner: axe-core checks an agent can call mid-workflow',
});
for (const { tool, handler } of accessibility_tools_js_1.accessibilityTools) {
    server.registerTool(tool, handler);
}
server.startStdio();
//# sourceMappingURL=accessibility.js.map