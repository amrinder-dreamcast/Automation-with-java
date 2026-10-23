#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_js_1 = require("../base/mcp-server.js");
const maestro_tools_js_1 = require("../tools/maestro-tools.js");
const server = new mcp_server_js_1.BaseMCPServer({
    name: 'maestro-mcp',
    version: '1.0.0',
    description: 'Maestro MCP: Test mobile apps (iOS/Android) against live emulators',
});
for (const { tool, handler } of maestro_tools_js_1.maestroTools) {
    server.registerTool(tool, handler);
}
server.startStdio();
//# sourceMappingURL=maestro.js.map