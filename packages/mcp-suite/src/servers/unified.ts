#!/usr/bin/env node
import { BaseMCPServer } from '../base/mcp-server.js';
import { playwrightTools } from '../tools/playwright-tools.js';
import { maestroTools } from '../tools/maestro-tools.js';
import { cypressTools } from '../tools/cypress-tools.js';
import { cloudDeviceTools } from '../tools/cloud-device-tools.js';
import { loadTestTools } from '../tools/load-test-tools.js';
import { reportportalTools } from '../tools/reportportal-tools.js';
import { vibiumTools } from '../tools/vibium-tools.js';
import { thunderTools } from '../tools/thunder-tools.js';
import { accessibilityTools } from '../tools/accessibility-tools.js';
import { testguildTools } from '../tools/testguild-tools.js';

const server = new BaseMCPServer({
  name: 'testpilot-unified-qa-mcp',
  version: '1.0.0',
  description: 'TestPilot Unified QA MCP Hub: All 10 Enterprise Automation, Mobile, Load, Accessibility, and Reporting MCP tools',
});

const allToolsets = [
  ...playwrightTools,
  ...maestroTools,
  ...cypressTools,
  ...cloudDeviceTools,
  ...loadTestTools,
  ...reportportalTools,
  ...vibiumTools,
  ...thunderTools,
  ...accessibilityTools,
  ...testguildTools,
];

for (const { tool, handler } of allToolsets) {
  server.registerTool(tool, handler);
}

server.startStdio();
