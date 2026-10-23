#!/usr/bin/env node
import { BaseMCPServer } from '../base/mcp-server.js';
import { playwrightTools } from '../tools/playwright-tools.js';

const server = new BaseMCPServer({
  name: 'playwright-mcp',
  version: '1.0.0',
  description: 'Playwright MCP: Automate browser & inspect DOM via Accessibility Tree',
});

for (const { tool, handler } of playwrightTools) {
  server.registerTool(tool, handler);
}

server.startStdio();
