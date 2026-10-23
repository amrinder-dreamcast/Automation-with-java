---
name: qa-mcp-suite
description: >-
  Enterprise QA and Autonomous Testing MCP Suite. Connects AI agents to Playwright AX parsing,
  Maestro mobile emulators, Cypress Cloud flaky test triage, BrowserStack/Kobiton real cloud hardware,
  Grafana k6 load testing, ReportPortal auto-analysis, Vibium BiDi natural control, Thunder intent authoring,
  axe-core accessibility scanning, and TestGuild 300+ tool stack matching.
---

# Enterprise QA MCP Suite Guide

This skill equips agents with a comprehensive, hardened set of 10 QA tools accessible through the Model Context Protocol (MCP) or direct programmatic execution.

## Tool Catalog & Core Capabilities

| Capability | Server Name | Core Tools | Primary Output |
| :--- | :--- | :--- | :--- |
| **Browser Automation & AX Tree** | `playwright` | `playwright_navigate`, `playwright_inspect_dom`, `playwright_click`, `playwright_type` | Semantic accessibility tree, avoiding token bloat |
| **Mobile Testing (iOS/Android)** | `maestro` | `maestro_author_flow`, `maestro_run_flow`, `maestro_inspect_hierarchy` | Declarative YAML flows and live emulator verdicts |
| **CI Failures & Flaky Tests** | `cypress-cloud` | `cypress_get_latest_runs`, `cypress_get_flaky_tests`, `cypress_diagnose_failure` | Root cause diagnosis (timing race, detached DOM, 500) |
| **Real Cloud Devices** | `browserstack` | `cloud_devices_catalog`, `cloud_devices_run_session`, `cloud_devices_get_telemetry` | Real iPhone/Pixel hardware sessions & telemetry |
| **Load & Performance Testing** | `grafana-k6` | `k6_run_load_test`, `k6_validate_script`, `octoperf_generate_scenario` | Concurrency RPS, latency percentiles (p50/p90/p95/p99) |
| **Test Reports & Root-Cause** | `reportportal` | `reportportal_get_launches`, `reportportal_auto_analysis`, `reportportal_get_logs` | Auto-classification into PB, AB, SI, TI with ML |
| **AI-Native WebDriver BiDi** | `vibium` | `vibium_execute_action`, `vibium_query_bidi_state`, `vibium_assert_semantic_state` | Bidirectional action execution from plain English |
| **Intent Authoring & Migration** | `thunder` | `thunder_author_from_intent`, `thunder_migrate_legacy`, `thunder_execute_intent` | Scriptless resilient intent specs & self-healing |
| **Accessibility Scanner** | `accessibility-scanner` | `axe_audit_url`, `axe_check_contrast`, `axe_remediate_violation` | WCAG 2.1 AA/AAA compliance audit and fixes |
| **QA Stack Matcher** | `testguild-tool-matcher` | `testguild_recommend_stack`, `testguild_search_tools`, `testguild_compare_tools` | Curated matching against 300+ QA tools database |

---

## Step-by-Step Agent Workflows

### 1. Diagnosing a Flaky CI Test
1. Call `cypress_get_flaky_tests` to find the highest-instability specs in the repository.
2. Call `cypress_diagnose_failure` with the failure stack trace.
3. If it is an async race condition, propose `cy.intercept()` or self-healing assertions.

### 2. Running an On-Demand Load Test Before Release
1. Call `k6_run_load_test` with `targetUrl: "https://staging.example.com"` and `scenario: "smoke"` (5 VUs) or `"load"` (20 VUs).
2. Inspect the returned `p95_Ms` and `errorRatePct`. If `p95_Ms > 500` or `errorRatePct > 1.0%`, report an SLA violation.

### 3. In-Workflow Accessibility Verification
1. Call `axe_audit_url` with the target page URL.
2. For any flagged violation, call `axe_remediate_violation` with the element snippet to generate a drop-in code fix.
3. Call `axe_check_contrast` to verify color accessibility on suspicious text elements.

### 4. Authoring Mobile Tests for Android/iOS
1. Call `maestro_author_flow` with user steps (e.g. `["tap Login", "type user@domain.com into Email", "assert Home visible"]`).
2. Call `maestro_run_flow` with the generated YAML flow to verify execution on a connected emulator.

### 5. Recommending a QA Stack
1. Call `testguild_recommend_stack` with project platform (`web`, `mobile`, `api`), team skills (`non_dev_qa` vs `sdets`), and focus.
2. Present the recommended stack with architectural trade-offs.
