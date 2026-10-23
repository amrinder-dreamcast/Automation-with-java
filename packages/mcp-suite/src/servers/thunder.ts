#!/usr/bin/env node
import { BaseMCPServer } from '../base/mcp-server.js';
import { thunderTools } from '../tools/thunder-tools.js';

const server = new BaseMCPServer({
  name: 'thunder-mcp',
  version: '1.0.0',
  description: 'Thunder MCP: Author & manage tests in natural language without scripts',
});

for (const { tool, handler } of thunderTools) {
  server.registerTool(tool, handler);
}

server.startStdio();
