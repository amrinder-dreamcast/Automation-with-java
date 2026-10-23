#!/usr/bin/env node
import { BaseMCPServer } from '../base/mcp-server.js';
import { cloudDeviceTools } from '../tools/cloud-device-tools.js';

const server = new BaseMCPServer({
  name: 'browserstack-kobiton-mcp',
  version: '1.0.0',
  description: 'BrowserStack & Kobiton MCP: Test on real iOS/Android cloud hardware',
});

for (const { tool, handler } of cloudDeviceTools) {
  server.registerTool(tool, handler);
}

server.startStdio();
