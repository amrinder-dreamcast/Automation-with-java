#!/usr/bin/env node
import { BaseMCPServer } from '../base/mcp-server.js';
import { loadTestTools } from '../tools/load-test-tools.js';

const server = new BaseMCPServer({
  name: 'grafana-k6-mcp',
  version: '1.0.0',
  description: 'Grafana k6 & OctoPerf MCP: Run load & performance tests directly from editor',
});

for (const { tool, handler } of loadTestTools) {
  server.registerTool(tool, handler);
}

server.startStdio();
