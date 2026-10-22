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
├── packages/
│   ├── core/           # SSRF protection, URL safety rules, base contracts
│   ├── crawler/        # Headless Playwright explorer and discovery engine
│   ├── engines/        # Functional, visual, accessibility & security test engines
│   ├── fixture-site/   # Local benchmark target site (port 4000)
│   ├── storage/        # Database vault and artifact persistence
│   ├── triage/         # Defect classification, severity analysis & reproduction steps
│   └── web/            # Full-stack dashboard, API server (port 3000), and UI assets
├── data/               # Seed database and QA execution artifacts
└── package.json        # NPM workspace orchestrator
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
All 32 automated unit and integration tests across all 7 workspace packages will execute.

### 4. Start the Application
```bash
npm start
```
- **Web Dashboard**: `http://localhost:3000`
- **Fixture Target Site**: `http://localhost:4000`

---

## 🔐 Authentication
- **Default Admin Demo**: `admin@testpilot.ai` / `pilotPass123!`
- Supports new user registration via the **Sign up** option.
- Supports password recovery via the **Forgot password?** workflow.
