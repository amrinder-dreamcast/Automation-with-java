/**
 * @testpilot/mcp-suite
 * Enterprise Unbreakable Model Context Protocol (MCP) QA Suite
 */

export * from './base/types.js';
export * from './base/resilience.js';
export * from './base/mcp-server.js';

export * from './tools/playwright-tools.js';
export * from './tools/maestro-tools.js';
export * from './tools/cypress-tools.js';
export * from './tools/cloud-device-tools.js';
export * from './tools/load-test-tools.js';
export * from './tools/reportportal-tools.js';
export * from './tools/vibium-tools.js';
export * from './tools/thunder-tools.js';
export * from './tools/accessibility-tools.js';
export * from './tools/testguild-tools.js';

import { playwrightTools } from './tools/playwright-tools.js';
import { maestroTools } from './tools/maestro-tools.js';
import { cypressTools } from './tools/cypress-tools.js';
import { cloudDeviceTools } from './tools/cloud-device-tools.js';
import { loadTestTools } from './tools/load-test-tools.js';
import { reportportalTools } from './tools/reportportal-tools.js';
import { vibiumTools } from './tools/vibium-tools.js';
import { thunderTools } from './tools/thunder-tools.js';
import { accessibilityTools } from './tools/accessibility-tools.js';
import { testguildTools } from './tools/testguild-tools.js';

export const ALL_MCP_TOOLSETS = [
  { name: 'playwright', title: 'Playwright MCP (Microsoft)', tools: playwrightTools },
  { name: 'maestro', title: 'Maestro Mobile MCP', tools: maestroTools },
  { name: 'cypress', title: 'Cypress Cloud MCP', tools: cypressTools },
  { name: 'browserstack', title: 'BrowserStack & Kobiton MCP', tools: cloudDeviceTools },
  { name: 'k6', title: 'Grafana k6 & OctoPerf MCP', tools: loadTestTools },
  { name: 'reportportal', title: 'ReportPortal AI MCP', tools: reportportalTools },
  { name: 'vibium', title: 'Vibium BiDi MCP', tools: vibiumTools },
  { name: 'thunder', title: 'Thunder Intent MCP', tools: thunderTools },
  { name: 'accessibility', title: 'axe-core Accessibility Scanner MCP', tools: accessibilityTools },
  { name: 'testguild', title: 'TestGuild Tool Matcher MCP', tools: testguildTools },
];
