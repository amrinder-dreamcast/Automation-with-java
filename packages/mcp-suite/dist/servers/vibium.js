#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_js_1 = require("../base/mcp-server.js");
const vibium_tools_js_1 = require("../tools/vibium-tools.js");
const server = new mcp_server_js_1.BaseMCPServer({
    name: 'vibium-mcp',
    version: '1.0.0',
    description: 'Vibium MCP: AI-native plain-English browser control on WebDriver BiDi',
});
for (const { tool, handler } of vibium_tools_js_1.vibiumTools) {
    server.registerTool(tool, handler);
}
server.startStdio();
//# sourceMappingURL=vibium.js.map