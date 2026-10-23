#!/usr/bin/env node
import { BaseMCPServer } from '../base/mcp-server.js';
import { maestroTools } from '../tools/maestro-tools.js';

const server = new BaseMCPServer({
  name: 'maestro-mcp',
  version: '1.0.0',
  description: 'Maestro MCP: Test mobile apps (iOS/Android) against live emulators',
});

for (const { tool, handler } of maestroTools) {
  server.registerTool(tool, handler);
}

server.startStdio();
