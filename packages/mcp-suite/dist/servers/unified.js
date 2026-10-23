#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_js_1 = require("../base/mcp-server.js");
const playwright_tools_js_1 = require("../tools/playwright-tools.js");
const maestro_tools_js_1 = require("../tools/maestro-tools.js");
const cypress_tools_js_1 = require("../tools/cypress-tools.js");
const cloud_device_tools_js_1 = require("../tools/cloud-device-tools.js");
const load_test_tools_js_1 = require("../tools/load-test-tools.js");
const reportportal_tools_js_1 = require("../tools/reportportal-tools.js");
const vibium_tools_js_1 = require("../tools/vibium-tools.js");
const thunder_tools_js_1 = require("../tools/thunder-tools.js");
const accessibility_tools_js_1 = require("../tools/accessibility-tools.js");
const testguild_tools_js_1 = require("../tools/testguild-tools.js");
const server = new mcp_server_js_1.BaseMCPServer({
    name: 'testpilot-unified-qa-mcp',
    version: '1.0.0',
    description: 'TestPilot Unified QA MCP Hub: All 10 Enterprise Automation, Mobile, Load, Accessibility, and Reporting MCP tools',
});
const allToolsets = [
    ...playwright_tools_js_1.playwrightTools,
    ...maestro_tools_js_1.maestroTools,
    ...cypress_tools_js_1.cypressTools,
    ...cloud_device_tools_js_1.cloudDeviceTools,
    ...load_test_tools_js_1.loadTestTools,
    ...reportportal_tools_js_1.reportportalTools,
    ...vibium_tools_js_1.vibiumTools,
    ...thunder_tools_js_1.thunderTools,
    ...accessibility_tools_js_1.accessibilityTools,
    ...testguild_tools_js_1.testguildTools,
];
for (const { tool, handler } of allToolsets) {
    server.registerTool(tool, handler);
}
server.startStdio();
//# sourceMappingURL=unified.js.map