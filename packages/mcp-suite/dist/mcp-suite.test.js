"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const node_assert_1 = __importDefault(require("node:assert"));
const mcp_server_js_1 = require("./base/mcp-server.js");
const resilience_js_1 = require("./base/resilience.js");
const playwright_tools_js_1 = require("./tools/playwright-tools.js");
const maestro_tools_js_1 = require("./tools/maestro-tools.js");
const cypress_tools_js_1 = require("./tools/cypress-tools.js");
const cloud_device_tools_js_1 = require("./tools/cloud-device-tools.js");
const load_test_tools_js_1 = require("./tools/load-test-tools.js");
const reportportal_tools_js_1 = require("./tools/reportportal-tools.js");
const vibium_tools_js_1 = require("./tools/vibium-tools.js");
const thunder_tools_js_1 = require("./tools/thunder-tools.js");
const accessibility_tools_js_1 = require("./tools/accessibility-tools.js");
const testguild_tools_js_1 = require("./tools/testguild-tools.js");
(0, node_test_1.default)('MCP Suite: Secret Redaction & Resilience', () => {
    const dirty = 'Bearer abc1234567890123456 with api_key="secret-key-123456789012"';
    const clean = (0, resilience_js_1.redactSecrets)(dirty);
    node_assert_1.default.ok(!clean.includes('abc1234567890123456'));
    node_assert_1.default.ok(!clean.includes('secret-key-123456789012'));
    node_assert_1.default.ok(clean.includes('[REDACTED_TOKEN]'));
});
(0, node_test_1.default)('MCP Base Server: JSON-RPC 2.0 Protocol Compliance', async () => {
    const server = new mcp_server_js_1.BaseMCPServer({
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
    node_assert_1.default.strictEqual(initResp?.id, 1);
    node_assert_1.default.strictEqual(initResp?.result?.serverInfo?.name, 'test-server');
    node_assert_1.default.strictEqual(initResp?.result?.protocolVersion, '2024-11-05');
    // Ping
    const pingResp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'ping',
    });
    node_assert_1.default.strictEqual(pingResp?.id, 2);
    // Unknown method
    const unknownResp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 3,
        method: 'nonexistent_method',
    });
    node_assert_1.default.strictEqual(unknownResp?.error?.code, -32601);
});
(0, node_test_1.default)('MCP Tools 1: Playwright AX Inspection & Navigation Tools', async () => {
    const server = new mcp_server_js_1.BaseMCPServer({ name: 'playwright-test', version: '1.0.0' });
    for (const { tool, handler } of playwright_tools_js_1.playwrightTools) {
        server.registerTool(tool, handler);
    }
    const listResp = await server.handleRequest({ jsonrpc: '2.0', id: 10, method: 'tools/list' });
    node_assert_1.default.ok(listResp?.result?.tools.length >= 5);
    const toolNames = listResp?.result?.tools.map((t) => t.name);
    node_assert_1.default.ok(toolNames.includes('playwright_navigate'));
    node_assert_1.default.ok(toolNames.includes('playwright_inspect_dom'));
});
(0, node_test_1.default)('MCP Tools 2: Maestro Mobile iOS & Android Authoring', async () => {
    const server = new mcp_server_js_1.BaseMCPServer({ name: 'maestro-test', version: '1.0.0' });
    for (const { tool, handler } of maestro_tools_js_1.maestroTools) {
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
    node_assert_1.default.ok(!callResp?.result?.isError);
    const payload = JSON.parse(callResp?.result?.content[0].text);
    node_assert_1.default.strictEqual(payload.status, 'FLOW_AUTHORED');
    node_assert_1.default.ok(payload.yaml.includes('launchApp:'));
    node_assert_1.default.ok(payload.yaml.includes('tapOn: "Login"'));
});
(0, node_test_1.default)('MCP Tools 3: Cypress Cloud Flaky Test Analysis & Root-Cause', async () => {
    const server = new mcp_server_js_1.BaseMCPServer({ name: 'cypress-test', version: '1.0.0' });
    for (const { tool, handler } of cypress_tools_js_1.cypressTools) {
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
    node_assert_1.default.ok(!flakyResp?.result?.isError);
    const payload = JSON.parse(flakyResp?.result?.content[0].text);
    node_assert_1.default.ok(payload.flakyTests.length > 0);
    node_assert_1.default.ok(payload.flakyTests[0].flakinessRate);
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
    node_assert_1.default.strictEqual(diagPayload.diagnosis, 'SELECTOR_TIMEOUT_OR_DYNAMIC_LOAD');
});
(0, node_test_1.default)('MCP Tools 4: BrowserStack & Kobiton Real Device Catalog & Telemetry', async () => {
    const server = new mcp_server_js_1.BaseMCPServer({ name: 'devices-test', version: '1.0.0' });
    for (const { tool, handler } of cloud_device_tools_js_1.cloudDeviceTools) {
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
    node_assert_1.default.ok(catPayload.totalAvailable >= 4);
    node_assert_1.default.ok(catPayload.devices.some((d) => d.deviceName.includes('iPhone')));
    node_assert_1.default.ok(catPayload.devices.some((d) => d.deviceName.includes('Galaxy')));
});
(0, node_test_1.default)('MCP Tools 5: Grafana k6 Load Testing & Script Validation', async () => {
    const server = new mcp_server_js_1.BaseMCPServer({ name: 'k6-test', version: '1.0.0' });
    for (const { tool, handler } of load_test_tools_js_1.loadTestTools) {
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
    node_assert_1.default.strictEqual(payload.status, 'COMPLETED');
    node_assert_1.default.ok(payload.latencyDistribution.p95_Ms);
    node_assert_1.default.ok(payload.summary.throughputRps);
});
(0, node_test_1.default)('MCP Tools 6: ReportPortal Launches & AI Auto-Analysis', async () => {
    const server = new mcp_server_js_1.BaseMCPServer({ name: 'rp-test', version: '1.0.0' });
    for (const { tool, handler } of reportportal_tools_js_1.reportportalTools) {
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
    node_assert_1.default.strictEqual(payload.status, 'AUTO_ANALYSIS_COMPLETED');
    node_assert_1.default.ok(payload.classifiedFailures.some((f) => f.classification === 'PRODUCT_BUG'));
});
(0, node_test_1.default)('MCP Tools 7: Vibium AI-Native Browser Action on BiDi', async () => {
    const server = new mcp_server_js_1.BaseMCPServer({ name: 'vibium-test', version: '1.0.0' });
    for (const { tool, handler } of vibium_tools_js_1.vibiumTools) {
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
    node_assert_1.default.strictEqual(payload.status, 'EXECUTED_SUCCESSFULLY');
    node_assert_1.default.ok(payload.bidiExecutionDetails.command.includes('input.performActions'));
});
(0, node_test_1.default)('MCP Tools 8: Thunder Intent Authoring & Legacy Migration', async () => {
    const server = new mcp_server_js_1.BaseMCPServer({ name: 'thunder-test', version: '1.0.0' });
    for (const { tool, handler } of thunder_tools_js_1.thunderTools) {
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
    node_assert_1.default.strictEqual(payload.status, 'MIGRATION_COMPLETED');
    node_assert_1.default.strictEqual(payload.migratedStepCount, 2);
});
(0, node_test_1.default)('MCP Tools 9: Accessibility Scanner (axe-core) & Contrast Calculator', async () => {
    const server = new mcp_server_js_1.BaseMCPServer({ name: 'axe-test', version: '1.0.0' });
    for (const { tool, handler } of accessibility_tools_js_1.accessibilityTools) {
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
    node_assert_1.default.strictEqual(payload.contrastRatio, '21:1');
    node_assert_1.default.strictEqual(payload.passesWCAG_AA, true);
});
(0, node_test_1.default)('MCP Tools 10: TestGuild Tool Matcher & Stack Recommendation', async () => {
    const server = new mcp_server_js_1.BaseMCPServer({ name: 'testguild-test', version: '1.0.0' });
    for (const { tool, handler } of testguild_tools_js_1.testguildTools) {
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
    node_assert_1.default.strictEqual(payload.status, 'RECOMMENDATION_GENERATED');
    node_assert_1.default.ok(payload.recommendedStack.webAutomation);
    node_assert_1.default.ok(payload.recommendedStack.mobileAutomation);
    node_assert_1.default.ok(payload.recommendedStack.loadTesting);
});
//# sourceMappingURL=mcp-suite.test.js.map