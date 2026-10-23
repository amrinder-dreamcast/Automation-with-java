#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_js_1 = require("../base/mcp-server.js");
const load_test_tools_js_1 = require("../tools/load-test-tools.js");
const server = new mcp_server_js_1.BaseMCPServer({
    name: 'grafana-k6-mcp',
    version: '1.0.0',
    description: 'Grafana k6 & OctoPerf MCP: Run load & performance tests directly from editor',
});
for (const { tool, handler } of load_test_tools_js_1.loadTestTools) {
    server.registerTool(tool, handler);
}
server.startStdio();
//# sourceMappingURL=grafana-k6.js.map