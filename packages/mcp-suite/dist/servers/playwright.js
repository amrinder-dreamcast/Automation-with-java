#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_js_1 = require("../base/mcp-server.js");
const playwright_tools_js_1 = require("../tools/playwright-tools.js");
const server = new mcp_server_js_1.BaseMCPServer({
    name: 'playwright-mcp',
    version: '1.0.0',
    description: 'Playwright MCP: Automate browser & inspect DOM via Accessibility Tree',
});
for (const { tool, handler } of playwright_tools_js_1.playwrightTools) {
    server.registerTool(tool, handler);
}
server.startStdio();
//# sourceMappingURL=playwright.js.map