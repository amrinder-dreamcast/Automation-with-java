#!/usr/bin/env node
import { BaseMCPServer } from '../base/mcp-server.js';
import { vibiumTools } from '../tools/vibium-tools.js';

const server = new BaseMCPServer({
  name: 'vibium-mcp',
  version: '1.0.0',
  description: 'Vibium MCP: AI-native plain-English browser control on WebDriver BiDi',
});

for (const { tool, handler } of vibiumTools) {
  server.registerTool(tool, handler);
}

server.startStdio();
