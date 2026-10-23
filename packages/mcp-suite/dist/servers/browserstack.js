#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_js_1 = require("../base/mcp-server.js");
const cloud_device_tools_js_1 = require("../tools/cloud-device-tools.js");
const server = new mcp_server_js_1.BaseMCPServer({
    name: 'browserstack-kobiton-mcp',
    version: '1.0.0',
    description: 'BrowserStack & Kobiton MCP: Test on real iOS/Android cloud hardware',
});
for (const { tool, handler } of cloud_device_tools_js_1.cloudDeviceTools) {
    server.registerTool(tool, handler);
}
server.startStdio();
//# sourceMappingURL=browserstack.js.map