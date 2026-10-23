#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_js_1 = require("../base/mcp-server.js");
const cypress_tools_js_1 = require("../tools/cypress-tools.js");
const server = new mcp_server_js_1.BaseMCPServer({
    name: 'cypress-cloud-mcp',
    version: '1.0.0',
    description: 'Cypress Cloud MCP: Debug CI failures & flaky tests',
});
for (const { tool, handler } of cypress_tools_js_1.cypressTools) {
    server.registerTool(tool, handler);
}
server.startStdio();
//# sourceMappingURL=cypress-cloud.js.map