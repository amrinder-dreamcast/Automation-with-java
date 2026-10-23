#!/usr/bin/env node
import { BaseMCPServer } from '../base/mcp-server.js';
import { cypressTools } from '../tools/cypress-tools.js';

const server = new BaseMCPServer({
  name: 'cypress-cloud-mcp',
  version: '1.0.0',
  description: 'Cypress Cloud MCP: Debug CI failures & flaky tests',
});

for (const { tool, handler } of cypressTools) {
  server.registerTool(tool, handler);
}

server.startStdio();
