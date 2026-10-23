#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_js_1 = require("../base/mcp-server.js");
const testguild_tools_js_1 = require("../tools/testguild-tools.js");
const server = new mcp_server_js_1.BaseMCPServer({
    name: 'testguild-tool-matcher-mcp',
    version: '1.0.0',
    description: 'TestGuild Tool Matcher MCP: Queries curated database of 300+ QA tools to recommend a stack',
});
for (const { tool, handler } of testguild_tools_js_1.testguildTools) {
    server.registerTool(tool, handler);
}
server.startStdio();
//# sourceMappingURL=testguild.js.map