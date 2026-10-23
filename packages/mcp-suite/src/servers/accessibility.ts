#!/usr/bin/env node
import { BaseMCPServer } from '../base/mcp-server.js';
import { accessibilityTools } from '../tools/accessibility-tools.js';

const server = new BaseMCPServer({
  name: 'accessibility-scanner-mcp',
  version: '1.0.0',
  description: 'MCP Accessibility Scanner: axe-core checks an agent can call mid-workflow',
});

for (const { tool, handler } of accessibilityTools) {
  server.registerTool(tool, handler);
}

server.startStdio();
