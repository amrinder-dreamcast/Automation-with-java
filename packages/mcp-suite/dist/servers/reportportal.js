#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_js_1 = require("../base/mcp-server.js");
const reportportal_tools_js_1 = require("../tools/reportportal-tools.js");
const server = new mcp_server_js_1.BaseMCPServer({
    name: 'reportportal-mcp',
    version: '1.0.0',
    description: 'ReportPortal MCP: Query test reports & ML root-cause analysis',
});
for (const { tool, handler } of reportportal_tools_js_1.reportportalTools) {
    server.registerTool(tool, handler);
}
server.startStdio();
//# sourceMappingURL=reportportal.js.map