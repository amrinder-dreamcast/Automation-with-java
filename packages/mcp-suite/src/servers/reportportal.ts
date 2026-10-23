#!/usr/bin/env node
import { BaseMCPServer } from '../base/mcp-server.js';
import { reportportalTools } from '../tools/reportportal-tools.js';

const server = new BaseMCPServer({
  name: 'reportportal-mcp',
  version: '1.0.0',
  description: 'ReportPortal MCP: Query test reports & ML root-cause analysis',
});

for (const { tool, handler } of reportportalTools) {
  server.registerTool(tool, handler);
}

server.startStdio();
