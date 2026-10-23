#!/usr/bin/env node
import { BaseMCPServer } from '../base/mcp-server.js';
import { testguildTools } from '../tools/testguild-tools.js';

const server = new BaseMCPServer({
  name: 'testguild-tool-matcher-mcp',
  version: '1.0.0',
  description: 'TestGuild Tool Matcher MCP: Queries curated database of 300+ QA tools to recommend a stack',
});

for (const { tool, handler } of testguildTools) {
  server.registerTool(tool, handler);
}

server.startStdio();
