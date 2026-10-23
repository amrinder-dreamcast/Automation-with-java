# TestPilot AI Enterprise Core

> Autonomous, AI-powered end-to-end website testing, automated defect classification, and real-time QA intelligence platform.

---

## 🚀 Overview

TestPilot AI is an enterprise-grade automated testing suite designed to explore web applications, discover pages and user workflows, run multi-vector QA assertions, classify defects by severity (P1 to P4), track performance/Core Web Vitals, and generate audit-ready XLSX/CSV reports.

### Key Capabilities
- **Autonomous Site Exploration**: Crawler with SSRF domain safety guards, broken link detection, and interactive element mapping.
- **Multi-Vector Engine Testing**: Functional form submission, visual regression baseline comparison, accessibility violations, security passive analysis.
- **Automated Defect Triage**: Instant classification into severity tiers with reproduction checklists and verified badges.
- **Enterprise Authentication**: User registration, login with persistent sessions, password visibility toggles, and recovery workflows.
- **Executive Reporting & Export**: High-fidelity Excel (.xlsx) workbooks with styling and summaries, plus UTF-8 CSV exports.

---

## 📦 Monorepo Architecture

```
testaitool/
├── .agents/            # Antigravity agent configuration, MCP servers & rules
│   ├── mcp_config.json # Standard 10-server MCP configuration (JSON-RPC 2.0 stdio)
│   ├── rules/          # Unbreakable QA execution guardrails & SSRF rules
│   └── skills/         # qa-mcp-suite procedural guidelines
├── packages/
│   ├── core/           # SSRF protection, URL safety rules, base contracts
│   ├── crawler/        # Headless Playwright explorer and discovery engine
│   ├── engines/        # Functional, visual, accessibility & security test engines
│   ├── fixture-site/   # Local benchmark target site (port 4000)
│   ├── mcp-suite/      # 10 Enterprise MCP servers with resilience & circuit breakers
│   ├── storage/        # Database vault and artifact persistence
│   ├── triage/         # Defect classification, severity analysis & reproduction steps
│   └── web/            # Full-stack dashboard, API server (port 3000), and UI assets
├── data/               # Seed database and QA execution artifacts
└── package.json        # NPM workspace orchestrator
```

---

## 🔌 Enterprise MCP Suite (10 Servers, 28 Tools)

The system features an unbreakable Model Context Protocol (MCP) suite compliant with the 2024-11-05 specification. Each server operates via standard `stdio` (JSON-RPC 2.0) with automated error boundaries, credential sanitization, and fallback telemetry.

| Provider / Server | Core MCP Tools | Purpose |
| :--- | :--- | :--- |
| **Playwright MCP (Microsoft)** | `playwright_navigate`, `playwright_inspect_dom`, `playwright_click`, `playwright_type`, `playwright_screenshot` | Browser automation & accessibility tree (AX-tree) reasoning without token bloat. |
| **Maestro MCP** | `maestro_author_flow`, `maestro_run_flow`, `maestro_inspect_hierarchy` | Writes, runs, and debugs mobile tests against live iOS & Android emulators. |
| **Cypress Cloud MCP** | `cypress_get_latest_runs`, `cypress_get_flaky_tests`, `cypress_diagnose_failure` | Direct agent access to CI runs, stack traces, and flaky test root cause analysis. |
| **BrowserStack / Kobiton MCP** | `cloud_devices_catalog`, `cloud_devices_run_session`, `cloud_devices_get_telemetry` | Rent and drive real iOS/Android physical hardware from the IDE. |
| **Grafana k6 / OctoPerf MCP** | `k6_run_load_test`, `k6_validate_script`, `octoperf_generate_scenario` | Write, validate, and execute load/performance tests without leaving the editor. |
| **Report Portal MCP** | `reportportal_get_launches`, `reportportal_auto_analysis`, `reportportal_get_logs` | Pulls launches, logs, and ML auto-analysis to distinguish Product vs Automation bugs. |
| **Vibium** | `vibium_execute_action`, `vibium_query_bidi_state`, `vibium_assert_semantic_state` | AI-native plain-English browser control on W3C WebDriver BiDi protocol. |
| **Thunder MCP** | `thunder_author_from_intent`, `thunder_migrate_legacy`, `thunder_execute_intent` | Author and manage tests from intent for non-devs; migrate legacy suites. |
| **MCP Accessibility Scanner** | `axe_audit_url`, `axe_check_contrast`, `axe_remediate_violation` | In-workflow axe-core WCAG 2.1 AA/AAA compliance checks and CSS/HTML fixes. |
| **TestGuild Tool Matcher MCP** | `testguild_recommend_stack`, `testguild_search_tools`, `testguild_compare_tools` | Curated database of 300+ QA tools to recommend the optimal testing stack. |

### Running Standalone MCP Servers
Any MCP server can be launched directly via Node CLI or connected to any MCP client (Antigravity, Claude, Cursor):
```bash
# Example: Launching k6 Load Testing MCP Server
node packages/mcp-suite/dist/servers/grafana-k6.js

# Example: Launching Unified Hub (all 10 servers in 1 endpoint)
node packages/mcp-suite/dist/servers/unified.js
```

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build TypeScript Packages
```bash
npm run build
```

### 3. Run Monorepo Test Suites
```bash
npm test
```
All 49 automated unit, integration, and MCP protocol tests across all 8 workspace packages will execute.

### 4. Start the Application
```bash
npm start
```
- **Web Dashboard**: `http://localhost:3000` (Features interactive MCP Hub tab)
- **Fixture Target Site**: `http://localhost:4000`

---

## 🔐 Authentication
- **Default Admin Demo**: `admin@testpilot.ai` / `pilotPass123!`
- Supports new user registration via the **Sign up** option.
- Supports password recovery via the **Forgot password?** workflow.
