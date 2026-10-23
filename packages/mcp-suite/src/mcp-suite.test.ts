import test from 'node:test';
import assert from 'node:assert';
import { BaseMCPServer } from './base/mcp-server.js';
import { redactSecrets } from './base/resilience.js';
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

test('MCP Suite: Secret Redaction & Resilience', () => {
  const dirty = 'Bearer abc1234567890123456 with api_key="secret-key-123456789012"';
  const clean = redactSecrets(dirty);
  assert.ok(!clean.includes('abc1234567890123456'));
  assert.ok(!clean.includes('secret-key-123456789012'));
  assert.ok(clean.includes('[REDACTED_TOKEN]'));
});

test('MCP Base Server: JSON-RPC 2.0 Protocol Compliance', async () => {
  const server = new BaseMCPServer({
    name: 'test-server',
    version: '1.0.0',
  });

  // Initialize
  const initResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {},
  });
  assert.strictEqual(initResp?.id, 1);
  assert.strictEqual(initResp?.result?.serverInfo?.name, 'test-server');
  assert.strictEqual(initResp?.result?.protocolVersion, '2024-11-05');

  // Ping
  const pingResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'ping',
  });
  assert.strictEqual(pingResp?.id, 2);

  // Unknown method
  const unknownResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'nonexistent_method',
  });
  assert.strictEqual(unknownResp?.error?.code, -32601);
});

test('MCP Tools 1: Playwright AX Inspection & Navigation Tools', async () => {
  const server = new BaseMCPServer({ name: 'playwright-test', version: '1.0.0' });
  for (const { tool, handler } of playwrightTools) {
    server.registerTool(tool, handler);
  }

  const listResp = await server.handleRequest({ jsonrpc: '2.0', id: 10, method: 'tools/list' });
  assert.ok(listResp?.result?.tools.length >= 5);
  const toolNames = listResp?.result?.tools.map((t: any) => t.name);
  assert.ok(toolNames.includes('playwright_navigate'));
  assert.ok(toolNames.includes('playwright_inspect_dom'));
});

test('MCP Tools 2: Maestro Mobile iOS & Android Authoring', async () => {
  const server = new BaseMCPServer({ name: 'maestro-test', version: '1.0.0' });
  for (const { tool, handler } of maestroTools) {
    server.registerTool(tool, handler);
  }

  const callResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 20,
    method: 'tools/call',
    params: {
      name: 'maestro_author_flow',
      arguments: {
        appId: 'com.testpilot.mobile',
        steps: ['tap Login', 'type user@test.com into Email', 'assert Home visible'],
      },
    },
  });

  assert.ok(!callResp?.result?.isError);
  const payload = JSON.parse(callResp?.result?.content[0].text);
  assert.strictEqual(payload.status, 'FLOW_AUTHORED');
  assert.ok(payload.yaml.includes('launchApp:'));
  assert.ok(payload.yaml.includes('tapOn: "Login"'));
});

test('MCP Tools 3: Cypress Cloud Flaky Test Analysis & Root-Cause', async () => {
  const server = new BaseMCPServer({ name: 'cypress-test', version: '1.0.0' });
  for (const { tool, handler } of cypressTools) {
    server.registerTool(tool, handler);
  }

  const flakyResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 30,
    method: 'tools/call',
    params: {
      name: 'cypress_get_flaky_tests',
      arguments: { projectId: 'testpilot-core' },
    },
  });

  assert.ok(!flakyResp?.result?.isError);
  const payload = JSON.parse(flakyResp?.result?.content[0].text);
  assert.ok(payload.flakyTests.length > 0);
  assert.ok(payload.flakyTests[0].flakinessRate);

  const diagResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 31,
    method: 'tools/call',
    params: {
      name: 'cypress_diagnose_failure',
      arguments: {
        errorSnippet: 'AssertionError: Timed out retrying after 4000ms: Expected to find element: [data-testid="submit"]',
      },
    },
  });
  const diagPayload = JSON.parse(diagResp?.result?.content[0].text);
  assert.strictEqual(diagPayload.diagnosis, 'SELECTOR_TIMEOUT_OR_DYNAMIC_LOAD');
});

test('MCP Tools 4: BrowserStack & Kobiton Real Device Catalog & Telemetry', async () => {
  const server = new BaseMCPServer({ name: 'devices-test', version: '1.0.0' });
  for (const { tool, handler } of cloudDeviceTools) {
    server.registerTool(tool, handler);
  }

  const catResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 40,
    method: 'tools/call',
    params: {
      name: 'cloud_devices_catalog',
      arguments: { provider: 'all' },
    },
  });

  const catPayload = JSON.parse(catResp?.result?.content[0].text);
  assert.ok(catPayload.totalAvailable >= 4);
  assert.ok(catPayload.devices.some((d: any) => d.deviceName.includes('iPhone')));
  assert.ok(catPayload.devices.some((d: any) => d.deviceName.includes('Galaxy')));
});

test('MCP Tools 5: Grafana k6 Load Testing & Script Validation', async () => {
  const server = new BaseMCPServer({ name: 'k6-test', version: '1.0.0' });
  for (const { tool, handler } of loadTestTools) {
    server.registerTool(tool, handler);
  }

  const k6Resp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 50,
    method: 'tools/call',
    params: {
      name: 'k6_run_load_test',
      arguments: {
        targetUrl: 'http://localhost:3000',
        scenario: 'smoke',
        durationSec: 2,
      },
    },
  });

  const payload = JSON.parse(k6Resp?.result?.content[0].text);
  assert.strictEqual(payload.status, 'COMPLETED');
  assert.ok(payload.latencyDistribution.p95_Ms);
  assert.ok(payload.summary.throughputRps);
});

test('MCP Tools 6: ReportPortal Launches & AI Auto-Analysis', async () => {
  const server = new BaseMCPServer({ name: 'rp-test', version: '1.0.0' });
  for (const { tool, handler } of reportportalTools) {
    server.registerTool(tool, handler);
  }

  const analysisResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 60,
    method: 'tools/call',
    params: {
      name: 'reportportal_auto_analysis',
      arguments: { launchId: 'rp-launch-1082' },
    },
  });

  const payload = JSON.parse(analysisResp?.result?.content[0].text);
  assert.strictEqual(payload.status, 'AUTO_ANALYSIS_COMPLETED');
  assert.ok(payload.classifiedFailures.some((f: any) => f.classification === 'PRODUCT_BUG'));
});

test('MCP Tools 7: Vibium AI-Native Browser Action on BiDi', async () => {
  const server = new BaseMCPServer({ name: 'vibium-test', version: '1.0.0' });
  for (const { tool, handler } of vibiumTools) {
    server.registerTool(tool, handler);
  }

  const actionResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 70,
    method: 'tools/call',
    params: {
      name: 'vibium_execute_action',
      arguments: {
        instruction: 'click on checkout button',
        targetUrl: 'http://localhost:3000',
      },
    },
  });

  const payload = JSON.parse(actionResp?.result?.content[0].text);
  assert.strictEqual(payload.status, 'EXECUTED_SUCCESSFULLY');
  assert.ok(payload.bidiExecutionDetails.command.includes('input.performActions'));
});

test('MCP Tools 8: Thunder Intent Authoring & Legacy Migration', async () => {
  const server = new BaseMCPServer({ name: 'thunder-test', version: '1.0.0' });
  for (const { tool, handler } of thunderTools) {
    server.registerTool(tool, handler);
  }

  const migrateResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 80,
    method: 'tools/call',
    params: {
      name: 'thunder_migrate_legacy',
      arguments: {
        legacyCode: `driver.get("https://app.example.com");\ndriver.findElement(By.id("login")).click();`,
        sourceFramework: 'selenium',
      },
    },
  });

  const payload = JSON.parse(migrateResp?.result?.content[0].text);
  assert.strictEqual(payload.status, 'MIGRATION_COMPLETED');
  assert.strictEqual(payload.migratedStepCount, 2);
});

test('MCP Tools 9: Accessibility Scanner (axe-core) & Contrast Calculator', async () => {
  const server = new BaseMCPServer({ name: 'axe-test', version: '1.0.0' });
  for (const { tool, handler } of accessibilityTools) {
    server.registerTool(tool, handler);
  }

  const contrastResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 90,
    method: 'tools/call',
    params: {
      name: 'axe_check_contrast',
      arguments: {
        foregroundHex: '#000000',
        backgroundHex: '#FFFFFF',
      },
    },
  });

  const payload = JSON.parse(contrastResp?.result?.content[0].text);
  assert.strictEqual(payload.contrastRatio, '21:1');
  assert.strictEqual(payload.passesWCAG_AA, true);
});

test('MCP Tools 10: TestGuild Tool Matcher & Stack Recommendation', async () => {
  const server = new BaseMCPServer({ name: 'testguild-test', version: '1.0.0' });
  for (const { tool, handler } of testguildTools) {
    server.registerTool(tool, handler);
  }

  const recResp = await server.handleRequest({
    jsonrpc: '2.0',
    id: 100,
    method: 'tools/call',
    params: {
      name: 'testguild_recommend_stack',
      arguments: {
        platform: 'all',
        teamSkill: 'sdets_developers',
        budget: 'enterprise',
        focusArea: 'full_coverage',
      },
    },
  });

  const payload = JSON.parse(recResp?.result?.content[0].text);
  assert.strictEqual(payload.status, 'RECOMMENDATION_GENERATED');
  assert.ok(payload.recommendedStack.webAutomation);
  assert.ok(payload.recommendedStack.mobileAutomation);
  assert.ok(payload.recommendedStack.loadTesting);
});
