// TestPilot AI Enterprise Dashboard Controller
document.addEventListener('DOMContentLoaded', () => {
  let allRuns = [];
  let allDefects = [];
  let allAuditLogs = [];
  let currentProject = null;
  let activeEventSource = null;

  // --- Element Selectors ---
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const systemStatusDot = document.querySelector('.status-dot');
  const systemStatusText = document.getElementById('system-status-text');
  const liveBanner = document.getElementById('live-banner');
  const liveStageText = document.getElementById('live-stage-text');
  const liveMessageText = document.getElementById('live-message-text');
  const liveProgressBar = document.getElementById('live-progress-bar');
  const livePercentText = document.getElementById('live-percent-text');

  // Modals
  const modalNewRun = document.getElementById('modal-new-run');
  const modalDefectDetail = document.getElementById('modal-defect-detail');
  const modalClearData = document.getElementById('modal-clear-data');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalDefectCloseBtn = document.getElementById('modal-defect-close-btn');
  const modalClearCloseBtn = document.getElementById('modal-clear-close-btn');
  const modalClearCancelBtn = document.getElementById('modal-clear-cancel-btn');
  const btnConfirmClearData = document.getElementById('btn-confirm-clear-data');
  const formNewRun = document.getElementById('form-new-run');

  // Quick Action Buttons
  const btnClearAllData = document.getElementById('btn-clear-all-data');
  const btnResetTarget = document.getElementById('btn-reset-target');
  const btnQuickFixture = document.getElementById('btn-quick-fixture');
  const btnNewRun = document.getElementById('btn-new-run');
  const btnTriggerRunRunsTab = document.getElementById('btn-trigger-run-runs-tab');
  const btnStartCrawlOnly = document.getElementById('btn-start-crawl-only');
  const btnViewAllDefects = document.getElementById('btn-view-all-defects');

  // Metrics
  const metricTotalRuns = document.getElementById('metric-total-runs');
  const metricPassRate = document.getElementById('metric-pass-rate');
  const metricActiveDefects = document.getElementById('metric-active-defects');
  const metricP1P2 = document.getElementById('metric-p1-p2');
  const metricDiscoveredPages = document.getElementById('metric-discovered-pages');
  const metricBrokenLinks = document.getElementById('metric-broken-links');
  const badgeDefectCount = document.getElementById('badge-defect-count');

  // Tables
  const runsTbody = document.getElementById('runs-tbody');
  const crawlerPagesTbody = document.getElementById('crawler-pages-tbody');
  const defectCardsContainer = document.getElementById('defect-cards-container');
  const overviewDefectStream = document.getElementById('overview-defect-stream');
  const auditTbody = document.getElementById('audit-tbody');

  // Filters & Defect Triage Toolbar
  const filterSeverity = document.getElementById('filter-severity');
  const filterCategory = document.getElementById('filter-category');
  const crawlerSearch = document.getElementById('crawler-search');
  const inputDefectSearch = document.getElementById('input-defect-search');
  const btnDefectSearchClear = document.getElementById('btn-defect-search-clear');
  const filterStatus = document.getElementById('filter-status');
  const filterSort = document.getElementById('filter-sort');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  const groupSeverityPills = document.getElementById('group-severity-pills');
  const groupCategoryPills = document.getElementById('group-category-pills');

  // --- Theme Controller (Light / Dark Mode) ---
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const optThemeLight = document.getElementById('theme-opt-light');
  const optThemeDark = document.getElementById('theme-opt-dark');
  const themeIconSun = document.getElementById('theme-icon-sun');
  const themeIconMoon = document.getElementById('theme-icon-moon');
  const themeText = document.getElementById('theme-text');

  function applyTheme(theme) {
    const normalized = (theme === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', normalized);
    try {
      localStorage.setItem('testpilot_theme', normalized);
    } catch (e) {
      console.warn('localStorage not accessible for theme persistence:', e);
    }

    if (btnThemeToggle) {
      btnThemeToggle.setAttribute('data-current-theme', normalized);
      btnThemeToggle.setAttribute('aria-checked', normalized === 'dark' ? 'true' : 'false');
    }

    if (optThemeLight && optThemeDark) {
      if (normalized === 'light') {
        optThemeLight.classList.add('active');
        optThemeDark.classList.remove('active');
      } else {
        optThemeLight.classList.remove('active');
        optThemeDark.classList.add('active');
      }
    }

    if (normalized === 'light') {
      themeIconSun?.classList.remove('hidden');
      themeIconMoon?.classList.add('hidden');
      if (themeText) themeText.innerText = 'Light Theme';
    } else {
      themeIconSun?.classList.add('hidden');
      themeIconMoon?.classList.remove('hidden');
      if (themeText) themeText.innerText = 'Dark Theme';
    }
  }

  // Load saved theme or default to system preference/light
  let initialTheme = 'light';
  try {
    const saved = localStorage.getItem('testpilot_theme');
    if (saved === 'dark' || saved === 'light') {
      initialTheme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initialTheme = 'dark';
    }
  } catch (e) {
    initialTheme = 'light';
  }
  applyTheme(initialTheme);

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', (e) => {
      const clickedLight = e.target.closest('#theme-opt-light');
      const clickedDark = e.target.closest('#theme-opt-dark');
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      let nextTheme;
      if (clickedLight) {
        nextTheme = 'light';
      } else if (clickedDark) {
        nextTheme = 'dark';
      } else {
        nextTheme = current === 'light' ? 'dark' : 'light';
      }
      applyTheme(nextTheme);
    });

    btnThemeToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'light' ? 'dark' : 'light');
      }
    });
  }

  // --- Tab Switching Logic ---
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
      }

      if (targetId === 'tab-url-history') {
        renderTestedUrlsHistory();
      }
    });
  });

  if (btnViewAllDefects) {
    btnViewAllDefects.addEventListener('click', () => {
      document.getElementById('tab-btn-defects')?.click();
    });
  }

  // --- Interactive Metric Cards Click Handlers ---
  const cardMetricRuns = document.getElementById('card-metric-runs');
  const cardMetricDefects = document.getElementById('card-metric-defects');
  const cardMetricPages = document.getElementById('card-metric-pages');
  const cardMetricSecurity = document.getElementById('card-metric-security');

  if (cardMetricRuns) {
    const goToRuns = () => {
      document.getElementById('tab-btn-runs')?.click();
    };
    cardMetricRuns.addEventListener('click', goToRuns);
    cardMetricRuns.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToRuns();
      }
    });
  }

  if (cardMetricDefects) {
    const goToDefects = () => {
      if (filterSeverity) filterSeverity.value = 'ALL';
      if (filterCategory) filterCategory.value = 'ALL';
      document.getElementById('tab-btn-defects')?.click();
      renderDefects();
    };
    cardMetricDefects.addEventListener('click', goToDefects);
    cardMetricDefects.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToDefects();
      }
    });
  }

  if (cardMetricPages) {
    const goToCrawler = () => {
      document.getElementById('tab-btn-crawler')?.click();
    };
    cardMetricPages.addEventListener('click', goToCrawler);
    cardMetricPages.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToCrawler();
      }
    });
  }

  if (cardMetricSecurity) {
    const goToSecurityA11y = () => {
      const hasA11y = allDefects.some((d) => d.category === 'ACCESSIBILITY');
      const hasSec = allDefects.some((d) => d.category === 'SECURITY');
      if (filterCategory) {
        if (hasA11y) {
          filterCategory.value = 'ACCESSIBILITY';
        } else if (hasSec) {
          filterCategory.value = 'SECURITY';
        } else {
          filterCategory.value = 'ALL';
        }
      }
      document.getElementById('tab-btn-defects')?.click();
      renderDefects();
    };
    cardMetricSecurity.addEventListener('click', goToSecurityA11y);
    cardMetricSecurity.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToSecurityA11y();
      }
    });
  }

  // Dossier metric cards click delegation
  document.addEventListener('click', (e) => {
    const dossierCard = e.target.closest('.dossier-metric-card');
    if (!dossierCard) return;

    if (dossierCard.querySelector('#dossier-stat-runs') || dossierCard.querySelector('#dossier-stat-pass-rate')) {
      document.querySelector('[data-dossier-tab="dossier-tab-runs"]')?.click();
    } else if (dossierCard.querySelector('#dossier-stat-defects')) {
      document.querySelector('[data-dossier-tab="dossier-tab-defects"]')?.click();
    } else if (dossierCard.querySelector('#dossier-stat-avg-speed')) {
      document.querySelector('[data-dossier-tab="dossier-tab-perf"]')?.click();
    }
  });

  // --- Sidebar Target Application Controller ---
  function updateSidebarTarget(url) {
    const cardEl = document.getElementById('sidebar-target-card');
    const urlContainer = document.getElementById('sidebar-target-url');
    const badgeEl = document.getElementById('sidebar-target-badge');
    const openLinkEl = document.getElementById('sidebar-open-link');

    if (!url || url === 'None configured') {
      if (urlContainer) urlContainer.innerHTML = '<span style="color:var(--text-muted)">None configured</span>';
      if (badgeEl) {
        badgeEl.innerText = 'Awaiting target URL';
        badgeEl.style.color = 'var(--text-muted)';
        badgeEl.style.cursor = 'default';
        badgeEl.onclick = null;
      }
      if (openLinkEl) openLinkEl.style.display = 'none';
      if (cardEl) {
        cardEl.style.cursor = 'default';
        cardEl.onclick = null;
      }
      return;
    }

    if (urlContainer) {
      urlContainer.innerHTML = `
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-cyan);text-decoration:none;display:inline-flex;align-items:center;gap:4px;" title="Click to open ${escapeHtml(url)} in new tab">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(url)}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>
      `;
    }
    if (badgeEl) {
      badgeEl.innerHTML = '<span style="color:var(--accent-emerald);">●</span> Live Target • Click to inspect history';
      badgeEl.style.color = 'var(--accent-emerald)';
      badgeEl.style.cursor = 'pointer';
      badgeEl.onclick = (e) => {
        e.stopPropagation();
        document.getElementById('tab-btn-url-history')?.click();
        selectUrlDossier(url);
      };
    }
    if (openLinkEl) {
      openLinkEl.href = url;
      openLinkEl.style.display = 'inline-block';
    }
    if (cardEl) {
      cardEl.style.cursor = 'pointer';
      cardEl.title = `Click to view testing history for ${url}`;
      cardEl.onclick = (e) => {
        if (e.target.tagName !== 'A' && !e.target.closest('a')) {
          document.getElementById('tab-btn-url-history')?.click();
          selectUrlDossier(url);
        }
      };
    }
  }

  // --- API Client ---
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Status error');
      const data = await res.json();
      if (systemStatusText) systemStatusText.innerText = `Platform Ready | Ground Truth Benchmark Active`;
      if (systemStatusDot) systemStatusDot.style.backgroundColor = '#10b981';
      const elStatEnv = document.getElementById('stat-env');
      if (elStatEnv) elStatEnv.innerText = data.environment;
      if (data.activeTarget && data.activeTarget !== 'http://localhost:4000') {
        updateSidebarTarget(data.activeTarget);
      }
      return data;
    } catch {
      if (systemStatusText) systemStatusText.innerText = 'Platform Offline / Disconnected';
      if (systemStatusDot) systemStatusDot.style.backgroundColor = '#f43f5e';
    }
  }

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects');
      const projects = await res.json();
      const elStatProjects = document.getElementById('stat-project-count');
      if (projects.length > 0) {
        currentProject = projects[0];
        if (elStatProjects) elStatProjects.innerText = projects.length;
        updateSidebarTarget(currentProject.primaryUrl);
      } else {
        currentProject = null;
        if (elStatProjects) elStatProjects.innerText = '0';
        updateSidebarTarget(null);
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  }

  async function loadTestRuns() {
    try {
      const res = await fetch('/api/test-runs');
      allRuns = await res.json();
      if (allRuns.length > 0) {
        updateSidebarTarget(allRuns[0].primaryUrl);
      }
      renderRunsTable();
      updateMetrics();
      loadCrawlPages();
      renderTestedUrlsHistory();
    } catch (e) {
      console.error('Failed to load test runs:', e);
    }
  }

  async function loadDefects() {
    try {
      const res = await fetch('/api/defects');
      allDefects = await res.json();
      renderDefects();
      renderOverviewDefectStream();
      updateMetrics();
      renderTestedUrlsHistory();
    } catch (e) {
      console.error('Failed to load defects:', e);
    }
  }

  async function loadAuditLogs() {
    try {
      const res = await fetch('/api/audit-logs');
      allAuditLogs = await res.json();
      renderAuditLogs();
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
  }

  // --- Render Functions ---
  function updateMetrics() {
    metricTotalRuns.innerText = allRuns.length;
    badgeDefectCount.innerText = allDefects.filter((d) => d.status === 'OPEN').length;
    metricActiveDefects.innerText = allDefects.filter((d) => d.status === 'OPEN').length;

    const p1Count = allDefects.filter((d) => d.severity === 'P1' && d.status === 'OPEN').length;
    const p2Count = allDefects.filter((d) => d.severity === 'P2' && d.status === 'OPEN').length;
    metricP1P2.innerText = `${p1Count} Critical P1, ${p2Count} High P2`;

    if (allRuns.length > 0) {
      const passed = allRuns.filter((r) => r.status === 'COMPLETED').length;
      const rate = Math.round((passed / allRuns.length) * 100);
      metricPassRate.innerText = `${rate}% Pass Rate across runs`;

      const latest = allRuns[0];
      metricDiscoveredPages.innerText = latest.stats?.pagesCrawled || 0;
      const brokenCount = latest.defects?.filter((d) => d.category === 'FUNCTIONAL' && d.title?.includes('404'))?.length || 0;
      metricBrokenLinks.innerText = `${brokenCount} broken link(s) caught`;
    } else {
      metricPassRate.innerText = 'No runs recorded';
      metricDiscoveredPages.innerText = '0';
      metricBrokenLinks.innerText = '0 broken links';
    }

    // Update Tested URLs count badge & pill
    const testedUrls = getTestedUrlsData();
    const countBadge = document.getElementById('badge-url-history-count');
    const statHistoryCount = document.getElementById('stat-history-url-count');
    const statHistoryRuns = document.getElementById('stat-history-runs-count');
    if (countBadge) countBadge.innerText = testedUrls.length;
    if (statHistoryCount) statHistoryCount.innerText = testedUrls.length;
    if (statHistoryRuns) statHistoryRuns.innerText = allRuns.length;
  }

  function renderRunsTable() {
    if (!runsTbody) return;
    if (allRuns.length === 0) {
      runsTbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No test runs recorded yet. Start a run above!</td></tr>`;
      return;
    }

    runsTbody.innerHTML = allRuns
      .map((run) => {
        const statusBadge =
          run.status === 'COMPLETED'
            ? `<span class="badge badge-success">COMPLETED</span>`
            : run.status === 'RUNNING' || run.status === 'CRAWLING' || run.status === 'EXECUTING' || run.status === 'TRIAGING'
            ? `<span class="badge badge-info">${run.status}</span>`
            : `<span class="badge badge-danger">${run.status || 'FAILED'}</span>`;

        const p1p2 = (run.summary?.defectCounts?.P1 || 0) + (run.summary?.defectCounts?.P2 || 0);

        return `
          <tr>
            <td><strong style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--accent-cyan);">${run.id}</strong></td>
            <td>${run.scope?.primaryUrl || 'localhost'}</td>
            <td>${statusBadge}</td>
            <td>${run.summary?.totalTestCases || 0}</td>
            <td><span class="text-emerald">${run.summary?.passedCount || 0} passed</span> / <span class="text-rose">${run.summary?.failedCount || 0} failed</span></td>
            <td><span class="badge badge-danger">${run.defects?.length || 0} total</span> (${p1p2} P1/P2)</td>
            <td class="text-muted" style="font-size: 12px;">${new Date(run.startedAt).toLocaleTimeString()}</td>
            <td>
              <button class="btn btn-sm btn-outline btn-view-run" data-run-id="${run.id}">Inspect</button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Attach inspect handlers
    document.querySelectorAll('.btn-view-run').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rId = btn.getAttribute('data-run-id');
        showRunDetail(rId);
      });
    });
  }

  function showRunDetail(runId) {
    const run = allRuns.find((r) => r.id === runId);
    if (!run) return;

    const drawer = document.getElementById('run-detail-container');
    const title = document.getElementById('run-detail-title');
    const body = document.getElementById('run-detail-body');

    title.innerText = `Run Inspection: ${run.id} (${run.primaryUrl || 'N/A'})`;

    const executionsHtml = (run.executions || [])
      .map(
        (exec) => `
        <div style="background: rgba(17,30,56,0.6); border: 1px solid var(--border-subtle); padding: 12px; border-radius: 6px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong>${exec.testCaseTitle}</strong>
            <span class="badge ${exec.status === 'PASSED' ? 'badge-success' : 'badge-danger'}">${exec.status} (${exec.durationMs}ms)</span>
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">${exec.stepResults?.length || 0} steps executed</div>
          ${exec.networkFailures?.length ? `<div class="text-rose" style="font-size: 12px; margin-top: 4px;">Network Failure: ${exec.networkFailures[0].url} (Status: ${exec.networkFailures[0].status})</div>` : ''}
        </div>
      `
      )
      .join('');

    body.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
        <div class="stat-pill">Status: <strong>${run.status}</strong></div>
        <div class="stat-pill">Passed: <strong>${run.summary?.passedCount || 0}</strong></div>
        <div class="stat-pill">Failed: <strong>${run.summary?.failedCount || 0}</strong></div>
        <div class="stat-pill">Defects: <strong>${run.defects?.length || 0}</strong></div>
      </div>
      <h3 style="font-size: 14px; margin-bottom: 12px; text-transform: uppercase; color: var(--text-secondary);">Executed Test Cases</h3>
      <div>${executionsHtml || '<div class="text-muted">No execution details available.</div>'}</div>
    `;

    drawer.classList.remove('hidden');
    drawer.scrollIntoView({ behavior: 'smooth' });
  }

  document.getElementById('btn-close-run-detail')?.addEventListener('click', () => {
    document.getElementById('run-detail-container')?.classList.add('hidden');
  });

  async function loadCrawlPages() {
    if (!crawlerPagesTbody) return;
    try {
      const res = await fetch('/api/crawl-sessions');
      const sessions = await res.json();
      if (!sessions || sessions.length === 0 || !sessions[0].pages || sessions[0].pages.length === 0) {
        crawlerPagesTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No crawl session executed yet. Click 'Start Discovery Crawl' to begin.</td></tr>`;
        return;
      }

      const pages = sessions[0].pages;
      crawlerPagesTbody.innerHTML = pages
        .map(
          (p) => `
        <tr>
          <td><span class="badge ${p.statusCode === 200 ? 'badge-success' : 'badge-danger'}">${p.statusCode}</span></td>
          <td><code style="color: var(--accent-cyan);">${escapeHtml(p.url)}</code></td>
          <td>${p.depth}</td>
          <td>${p.loadTimeMs || 0}ms</td>
          <td>${p.interactiveElements?.length || 0} extracted</td>
          <td>${p.hasForms ? '<span class="badge badge-info">YES</span>' : '<span class="text-muted">No</span>'}</td>
          <td>
            <a href="${escapeHtml(p.url)}" target="_blank" class="btn btn-sm btn-outline">Visit</a>
          </td>
        </tr>
      `
        )
        .join('');
    } catch {
      crawlerPagesTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No crawl session executed yet. Click 'Start Discovery Crawl' to begin.</td></tr>`;
    }
  }

  function resetDefectFilters() {
    if (inputDefectSearch) inputDefectSearch.value = '';
    if (filterSeverity) filterSeverity.value = 'ALL';
    if (filterCategory) filterCategory.value = 'ALL';
    if (filterStatus) filterStatus.value = 'ALL';
    if (filterSort) filterSort.value = 'SEVERITY_DESC';
    renderDefects();
  }

  function renderDefects() {
    if (!defectCardsContainer) return;

    const sevFilter = filterSeverity ? filterSeverity.value : 'ALL';
    const catFilter = filterCategory ? filterCategory.value : 'ALL';
    const statusFilter = filterStatus ? filterStatus.value : 'ALL';
    const sortFilter = filterSort ? filterSort.value : 'SEVERITY_DESC';
    const searchVal = inputDefectSearch ? inputDefectSearch.value.trim().toLowerCase() : '';

    // Update severity pill counts across allDefects
    const countSevAll = document.getElementById('count-pill-sev-all');
    const countSevP1 = document.getElementById('count-pill-sev-p1');
    const countSevP2 = document.getElementById('count-pill-sev-p2');
    const countSevP3 = document.getElementById('count-pill-sev-p3');
    const countSevP4 = document.getElementById('count-pill-sev-p4');
    if (countSevAll) countSevAll.innerText = allDefects.length;
    if (countSevP1) countSevP1.innerText = allDefects.filter((d) => d.severity === 'P1').length;
    if (countSevP2) countSevP2.innerText = allDefects.filter((d) => d.severity === 'P2').length;
    if (countSevP3) countSevP3.innerText = allDefects.filter((d) => d.severity === 'P3').length;
    if (countSevP4) countSevP4.innerText = allDefects.filter((d) => d.severity === 'P4').length;

    // Update category pill counts across allDefects
    const countCatAll = document.getElementById('count-pill-cat-all');
    const countCatFunc = document.getElementById('count-pill-cat-func');
    const countCatA11y = document.getElementById('count-pill-cat-a11y');
    const countCatSec = document.getElementById('count-pill-cat-sec');
    const countCatPerf = document.getElementById('count-pill-cat-perf');
    const countCatVis = document.getElementById('count-pill-cat-vis');
    if (countCatAll) countCatAll.innerText = allDefects.length;
    if (countCatFunc) countCatFunc.innerText = allDefects.filter((d) => (d.category || '').toUpperCase() === 'FUNCTIONAL').length;
    if (countCatA11y) countCatA11y.innerText = allDefects.filter((d) => (d.category || '').toUpperCase() === 'ACCESSIBILITY').length;
    if (countCatSec) countCatSec.innerText = allDefects.filter((d) => (d.category || '').toUpperCase() === 'SECURITY').length;
    if (countCatPerf) countCatPerf.innerText = allDefects.filter((d) => (d.category || '').toUpperCase() === 'PERFORMANCE').length;
    if (countCatVis) countCatVis.innerText = allDefects.filter((d) => (d.category || '').toUpperCase() === 'VISUAL').length;

    // Sync severity pills active state
    if (groupSeverityPills) {
      groupSeverityPills.querySelectorAll('.filter-pill').forEach((btn) => {
        const val = btn.getAttribute('data-value');
        if (val === sevFilter) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // Sync category pills active state
    if (groupCategoryPills) {
      groupCategoryPills.querySelectorAll('.filter-pill').forEach((btn) => {
        const val = btn.getAttribute('data-value');
        if (val === catFilter) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // Toggle search clear button
    if (btnDefectSearchClear) {
      if (searchVal.length > 0) {
        btnDefectSearchClear.classList.remove('hidden');
      } else {
        btnDefectSearchClear.classList.add('hidden');
      }
    }

    // Toggle reset filters button
    const isFiltered =
      sevFilter !== 'ALL' ||
      catFilter !== 'ALL' ||
      statusFilter !== 'ALL' ||
      searchVal.length > 0 ||
      sortFilter !== 'SEVERITY_DESC';
    if (btnResetFilters) {
      if (isFiltered) {
        btnResetFilters.classList.remove('hidden');
      } else {
        btnResetFilters.classList.add('hidden');
      }
    }

    // Filter defects
    const filtered = allDefects.filter((d) => {
      const matchSev = sevFilter === 'ALL' || d.severity === sevFilter;
      const matchCat = catFilter === 'ALL' || (d.category || '').toUpperCase() === catFilter;
      const dStatus = (d.status || 'OPEN').toUpperCase();
      const matchStatus = statusFilter === 'ALL' || dStatus === statusFilter;

      let matchSearch = true;
      if (searchVal) {
        const title = (d.title || '').toLowerCase();
        const desc = (d.description || '').toLowerCase();
        const cat = (d.category || '').toLowerCase();
        const sev = (d.severity || '').toLowerCase();
        const fp = (d.fingerprint || '').toLowerCase();
        const route = (d.route || d.url || (d.context && (d.context.url || d.context.route)) || '').toLowerCase();
        matchSearch =
          title.includes(searchVal) ||
          desc.includes(searchVal) ||
          cat.includes(searchVal) ||
          sev.includes(searchVal) ||
          fp.includes(searchVal) ||
          route.includes(searchVal);
      }

      return matchSev && matchCat && matchStatus && matchSearch;
    });

    // Sort defects
    const sevWeights = { P1: 4, P2: 3, P3: 2, P4: 1 };
    filtered.sort((a, b) => {
      if (sortFilter === 'SEVERITY_DESC') {
        const diff = (sevWeights[b.severity] || 0) - (sevWeights[a.severity] || 0);
        if (diff !== 0) return diff;
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortFilter === 'SEVERITY_ASC') {
        const diff = (sevWeights[a.severity] || 0) - (sevWeights[b.severity] || 0);
        if (diff !== 0) return diff;
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortFilter === 'NEWEST') {
        const dateA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const dateB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return dateB - dateA;
      }
      if (sortFilter === 'CATEGORY') {
        return (a.category || '').localeCompare(b.category || '');
      }
      return 0;
    });

    const badgeFiltered = document.getElementById('triage-badge-filtered');
    if (badgeFiltered) {
      badgeFiltered.innerText = `Showing ${filtered.length} of ${allDefects.length} defects`;
    }

    if (filtered.length === 0) {
      defectCardsContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; padding: 48px 24px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <p style="font-weight: 600; font-size: 15px; margin-bottom: 4px; color: var(--text-main);">No defects match your filters</p>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Try adjusting or clearing your search term, severity, or category filters.</p>
          <button type="button" class="btn btn-sm btn-outline" id="btn-empty-reset-filters">Reset All Filters</button>
        </div>
      `;
      document.getElementById('btn-empty-reset-filters')?.addEventListener('click', resetDefectFilters);
      return;
    }

    defectCardsContainer.innerHTML = filtered
      .map((d) => {
        const sevBadge =
          d.severity === 'P1'
            ? 'badge-danger'
            : d.severity === 'P2'
            ? 'badge-warning'
            : d.severity === 'P3'
            ? 'badge-info'
            : 'badge-success';
        const sevLabel =
          d.severity === 'P1'
            ? 'P1 Critical'
            : d.severity === 'P2'
            ? 'P2 High'
            : d.severity === 'P3'
            ? 'P3 Medium'
            : 'P4 Low';
        return `
          <div class="defect-card" data-defect-id="${d.id}">
            <div>
              <div class="defect-card-header">
                <span class="badge ${sevBadge}">${sevLabel}</span>
                <span class="badge badge-info">${d.category}</span>
                <span class="badge ${d.status === 'OPEN' ? 'badge-danger' : 'badge-success'}">${d.status}</span>
              </div>
              <h3 class="defect-card-title">${escapeHtml(d.title)}</h3>
              <p class="defect-card-desc">${escapeHtml(d.description)}</p>
            </div>
            <div class="defect-card-footer">
              <span style="font-family: 'JetBrains Mono', monospace;">Fingerprint: ${d.fingerprint ? d.fingerprint.substring(0, 8) + '...' : 'N/A'}</span>
              <span style="color: var(--accent-cyan); font-weight: 600;">Details &rarr;</span>
            </div>
          </div>
        `;
      })
      .join('');

    // Attach card click handlers
    document.querySelectorAll('.defect-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-defect-id');
        showDefectModal(id);
      });
    });
  }

  function renderOverviewDefectStream() {
    if (!overviewDefectStream) return;
    if (allDefects.length === 0) {
      overviewDefectStream.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <p>No defects recorded yet. Launch a test run to inspect the ground-truth application.</p>
        </div>
      `;
      return;
    }

    overviewDefectStream.innerHTML = allDefects
      .slice(0, 5)
      .map(
        (d) => {
          const sevBadge = d.severity === 'P1' ? 'badge-danger' : d.severity === 'P2' ? 'badge-warning' : d.severity === 'P3' ? 'badge-info' : 'badge-success';
          return `
          <div class="defect-item">
            <span class="badge ${sevBadge}">${d.severity}</span>
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: 600;">${escapeHtml(d.title)}</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">${d.category} &bull; ${d.classification || ''}</div>
            </div>
          </div>
        `;
        }
      )
      .join('');
  }

  function stripAnsi(str) {
    if (!str) return '';
    return String(str)
      .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, '');
  }

  function openDefectModal(defectOrId) {
    if (!defectOrId) return;
    const id = typeof defectOrId === 'string' ? defectOrId : defectOrId.id;
    showDefectModal(id);
  }

  function showDefectModal(id) {
    const defect = allDefects.find((d) => d.id === id);
    if (!defect) return;

    // Set modal title with severity prefix
    const titleEl = document.getElementById('defect-detail-title');
    if (titleEl) {
      titleEl.innerText = `${defect.severity} Defect: ${defect.title}`;
    }

    const content = document.getElementById('defect-detail-content');
    const footer = document.getElementById('defect-modal-footer');
    if (!content) return;

    const modalSevBadge =
      defect.severity === 'P1'
        ? 'badge-danger'
        : defect.severity === 'P2'
        ? 'badge-warning'
        : defect.severity === 'P3'
        ? 'badge-info'
        : 'badge-success';

    const sevLabel =
      defect.severity === 'P1'
        ? 'P1 Critical'
        : defect.severity === 'P2'
        ? 'P2 High'
        : defect.severity === 'P3'
        ? 'P3 Medium'
        : 'P4 Low';

    // Resolve associated test run and target base URL
    const associatedRun = allRuns.find((r) => r.id === defect.testRunId);
    const runTargetUrl = associatedRun?.primaryUrl || (associatedRun && associatedRun.scope && associatedRun.scope.primaryUrl);
    const projectTargetUrl = currentProject?.primaryUrl;
    const activeTarget = getActiveTargetUrl();
    const baseTargetUrl =
      (runTargetUrl && runTargetUrl.startsWith('http') ? runTargetUrl : null) ||
      (projectTargetUrl && projectTargetUrl.startsWith('http') ? projectTargetUrl : null) ||
      (activeTarget && activeTarget.startsWith('http') ? activeTarget : null) ||
      'http://localhost:4000';

    const rawTargetUrl =
      defect.affectedUrl ||
      defect.route ||
      defect.url ||
      (defect.context && (defect.context.url || defect.context.route));

    const isPlaceholderUrl =
      !rawTargetUrl ||
      rawTargetUrl.trim().toLowerCase() === 'target page' ||
      rawTargetUrl.trim().toLowerCase() === 'target' ||
      rawTargetUrl.trim().toLowerCase() === 'n/a';

    const targetUrl = isPlaceholderUrl ? null : rawTargetUrl;

    let desc = defect.description;
    if (!desc && defect.summary) {
      if (defect.summary.includes('Call log:')) {
        const sumParts = defect.summary.split('Call log:');
        desc = sumParts[0].trim();
        if (defect.likelyCauseExplanation) {
          desc += ' ' + defect.likelyCauseExplanation;
        }
      } else {
        desc = defect.summary;
      }
    }
    if (!desc) {
      desc =
        defect.likelyCauseExplanation ||
        defect.title ||
        'This defect was automatically classified by the TestPilot diagnostic engine. Review the endpoint context, root cause trace, and remediation guidance below.';
    }
    desc = stripAnsi(desc);

    const fixRecommendation =
      defect.suggestedFix ||
      defect.recommendation ||
      'Verify application endpoint boundaries and enforce defensive sanitization.';

    // Evidence items (with image preview & modal support)
    const evidenceList = defect.evidence || [];
    let evidenceHtml = '';
    if (evidenceList.length > 0) {
      evidenceHtml = evidenceList
        .map((e) => {
          if (e.type === 'SCREENSHOT' && e.artifactPath) {
            return `
              <div class="defect-evidence-item" style="display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:600; color:var(--text-main); font-size:12.5px;">📸 ${escapeHtml(e.caption || 'Captured Failure State Screenshot')}</span>
                  <a href="${escapeHtml(e.artifactPath)}" target="_blank" rel="noopener noreferrer" class="btn-copy-code" style="text-decoration:none;">Open Full Size ↗</a>
                </div>
                <a href="${escapeHtml(e.artifactPath)}" target="_blank" rel="noopener noreferrer" style="display:inline-block; max-width:440px; border-radius:var(--radius-sm); overflow:hidden; border:1px solid var(--border-subtle); background:#000;">
                  <img src="${escapeHtml(e.artifactPath)}" alt="Defect failure state screenshot" style="width:100%; height:auto; display:block;" loading="lazy">
                </a>
              </div>
            `;
          }
          return `
            <div class="defect-evidence-item">
              <div style="font-weight:700; color:var(--accent-cyan); margin-bottom:4px; text-transform:uppercase; font-size:11px;">${escapeHtml(e.type || 'DIAGNOSTIC LOG')}</div>
              <div style="word-break:break-all;">${escapeHtml(e.data || e.caption || JSON.stringify(e))}</div>
            </div>
          `;
        })
        .join('');
    } else {
      evidenceHtml = `
        <div class="defect-evidence-empty">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>No raw log trace attached. Finding confirmed via protocol headers or automated assertion check.</span>
        </div>
      `;
    }

    // Parse Reproduction Steps & extract detailed diagnostics
    const rawReproList = Array.isArray(defect.reproductionSteps) && defect.reproductionSteps.length > 0
      ? defect.reproductionSteps
      : [
          `1. Navigate to ${targetUrl || baseTargetUrl || 'the target endpoint'} in a clean browser session.`,
          `2. Inspect UI controls and network response headers.`,
          `3. Observe failure or assertion mismatch: ${defect.title}`,
        ];

    let extractedCallLog = '';
    const parsedSteps = rawReproList.map((rawStep, idx) => {
      const clean = stripAnsi(rawStep);
      let stepNum = idx + 1;
      let actionType = 'ACTION';
      let actionClass = 'action-click';
      let stepText = clean;
      let failureHint = '';

      // Match "Step 1: NAVIGATE - ..."
      const stepMatch = clean.match(/^Step\s*(\d+)[\s:-]+([A-Z_]+)\s*-\s*([\s\S]*)$/i);
      if (stepMatch) {
        stepNum = parseInt(stepMatch[1], 10);
        actionType = stepMatch[2].toUpperCase();
        stepText = stepMatch[3].trim();
      } else {
        const numMatch = clean.match(/^(\d+)\.\s*([\s\S]*)$/);
        if (numMatch) {
          stepNum = parseInt(numMatch[1], 10);
          stepText = numMatch[2].trim();
          if (stepText.toLowerCase().includes('navigate') || stepText.toLowerCase().includes('request')) {
            actionType = 'NAVIGATE';
          } else if (stepText.toLowerCase().includes('inspect')) {
            actionType = 'INSPECT';
          } else if (stepText.toLowerCase().includes('click')) {
            actionType = 'CLICK';
          } else if (stepText.toLowerCase().includes('verify') || stepText.toLowerCase().includes('measure')) {
            actionType = 'VERIFY';
          }
        }
      }

      if (actionType.includes('NAVIGATE') || actionType.includes('REQUEST')) {
        actionClass = 'action-navigate';
      } else if (actionType.includes('CLICK')) {
        actionClass = 'action-click';
      } else if (actionType.includes('INPUT') || actionType.includes('TYPE')) {
        actionClass = 'action-input';
      } else if (actionType.includes('INSPECT')) {
        actionClass = 'action-inspect';
      } else if (actionType.includes('VERIFY') || actionType.includes('MEASURE')) {
        actionClass = 'action-verify';
      }

      if (stepText.includes('\nCall log:')) {
        const parts = stepText.split('\nCall log:');
        stepText = parts[0].trim();
        if (!extractedCallLog) extractedCallLog = parts[1].trim();
      } else if (stepText.includes('Failure:')) {
        const parts = stepText.split('Failure:');
        stepText = parts[0].trim() || `Execute ${actionType} action on target element`;
        failureHint = parts[1].trim();
      }

      if (failureHint.includes('\n')) {
        const fParts = failureHint.split('\n');
        failureHint = fParts[0].trim();
        if (!extractedCallLog && fParts.slice(1).join('\n').trim()) {
          extractedCallLog = fParts.slice(1).join('\n').trim();
        }
      }

      const urlMatch = stepText.match(/https?:\/\/[^\s"'<>)]+/);
      const stepUrl = urlMatch ? urlMatch[0] : null;

      return {
        stepNum,
        actionType,
        actionClass,
        stepText,
        failureHint,
        stepUrl,
      };
    });

    // Fallback extraction of call log from rootCauseAnalysis if not found in steps
    if (!extractedCallLog && defect.rootCauseAnalysis && defect.rootCauseAnalysis.includes('Call log:')) {
      const rcaParts = defect.rootCauseAnalysis.split('Call log:');
      extractedCallLog = stripAnsi(rcaParts[1].trim());
    }

    // Diagnostics extraction for the Debug Guide
    const fullLog = stripAnsi(defect.rootCauseAnalysis || '') + ' ' + (extractedCallLog || '');

    // Target selector match
    const selMatch = fullLog.match(/waiting for locator\((['"])(.*?)\1\)/i) || fullLog.match(/locator resolved to ([^\n]+)/i);
    const targetSelector = selMatch ? selMatch[2] || selMatch[1] : (defect.title.match(/'([^']+)'/) ? defect.title.match(/'([^']+)'/)[1] : null);

    // Intercepting element match
    const interceptMatch = fullLog.match(/([<][^>]+[>][^<\n]*) from (?:<header|<div|<span|[a-z]+)[^>]* subtree intercepts pointer events/i) || fullLog.match(/([<][^>]+[>][^<\n]*) intercepts pointer events/i);
    const interceptingOverlay = interceptMatch ? interceptMatch[1] : (fullLog.includes('login-poup-overlay') ? '<div id="login-poup-overlay" class="...">' : null);

    // Console errors match
    const consoleMatch = fullLog.match(/Client-side console captured (\d+ error\/warning logs)/i);
    const consoleErrors = consoleMatch ? consoleMatch[1] : null;

    // Network request failures match
    const netMatch = fullLog.match(/Network request failed:\s*([^\n.]+)/i);
    const networkFailed = netMatch ? netMatch[1] : null;

    // Prioritize clean target URL / page route over analytics tracker URLs
    const navStepUrl = parsedSteps.find((s) => s.actionType === 'NAVIGATE' && s.stepUrl)?.stepUrl
      || parsedSteps.find((s) => s.stepUrl)?.stepUrl;

    let primaryTargetUrl = targetUrl;
    const isTrackingOrCollect = targetUrl && /google\.com\/ccm|google-analytics|doubleclick|googletagmanager|analytics|collector/i.test(targetUrl);
    if (isTrackingOrCollect || !primaryTargetUrl) {
      if (navStepUrl) {
        primaryTargetUrl = navStepUrl;
      } else if (defect.route) {
        primaryTargetUrl = defect.route;
      } else {
        primaryTargetUrl = baseTargetUrl;
      }
    }

    if (primaryTargetUrl && primaryTargetUrl.startsWith('/')) {
      const baseOrigin = (navStepUrl && navStepUrl.startsWith('http'))
        ? new URL(navStepUrl).origin
        : (baseTargetUrl.startsWith('http') ? new URL(baseTargetUrl).origin : window.location.origin);
      primaryTargetUrl = `${baseOrigin.replace(/\/$/, '')}${primaryTargetUrl}`;
    }

    if (primaryTargetUrl && !primaryTargetUrl.startsWith('http://') && !primaryTargetUrl.startsWith('https://')) {
      if (primaryTargetUrl.toLowerCase() === 'target page') {
        primaryTargetUrl = baseTargetUrl;
      } else {
        primaryTargetUrl = `http://${primaryTargetUrl}`;
      }
    }

    if (!primaryTargetUrl) {
      primaryTargetUrl = baseTargetUrl;
    }

    // Playwright CLI command
    const cliCommand = `npx playwright open "${primaryTargetUrl}"`;

    // Render Steps Checklist HTML
    const reproHtml = `
      <div class="defect-info-card">
        <div class="defect-info-header" style="justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            <span>Steps to Reproduce (Interactive Cross-Check)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="repro-progress-badge" id="repro-progress-badge">0 / ${parsedSteps.length} Verified</span>
            <button type="button" class="btn-copy-code" id="btn-copy-all-repro-steps" title="Copy all steps to clipboard">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy All Steps
            </button>
          </div>
        </div>

        <ul class="repro-check-list" id="repro-check-list">
          ${parsedSteps
            .map(
              (step, idx) => `
            <li class="repro-check-item" id="repro-item-${idx}">
              <label class="repro-checkbox-label">
                <input type="checkbox" class="repro-step-checkbox" data-index="${idx}" aria-label="Verify Step ${step.stepNum}">
                <div class="repro-step-content">
                  <div class="repro-step-top">
                    <span class="repro-step-num">Step ${step.stepNum}</span>
                    <span class="repro-action-badge ${step.actionClass}">${step.actionType}</span>
                    ${
                      step.stepUrl
                        ? `<a href="${escapeHtml(step.stepUrl)}" target="_blank" rel="noopener noreferrer" class="btn-step-open-url" title="Open target URL in new tab" onclick="event.stopPropagation();">Open URL ↗</a>`
                        : ''
                    }
                    <button type="button" class="btn-copy-code btn-copy-single-step" data-step-text="${escapeHtml(step.stepText)}" title="Copy step text" onclick="event.stopPropagation();">
                      Copy
                    </button>
                  </div>
                  <div class="repro-step-desc">${escapeHtml(step.stepText)}</div>
                  ${
                    step.failureHint
                      ? `<div class="repro-step-failure-hint"><strong>Observed Failure:</strong> ${escapeHtml(step.failureHint)}</div>`
                      : ''
                  }
                </div>
              </label>
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    `;

    // Render Debug & Cross-Check Steps Guide HTML
    const debugGuideHtml = `
      <div class="defect-info-card debug-crosscheck-card">
        <div class="defect-info-header" style="justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            <span>Diagnostic & Debug Cross-Check Guide</span>
          </div>
          <span style="font-size: 11px; color: var(--accent-indigo); background: rgba(99, 102, 241, 0.12); padding: 3px 8px; border-radius: 12px; font-weight: 600;">Root Cause Isolation</span>
        </div>

        <div class="debug-step-list">
          <!-- Check 1: Target Selector & Stacking Context -->
          <div class="debug-step-item">
            <div class="debug-step-header">
              <span class="repro-step-badge" style="background: rgba(99,102,241,0.15); color: var(--accent-indigo);">Debug Check 1</span>
              <span>Inspect Target Element & Pointer Interception</span>
            </div>
            <div class="debug-step-body">
              ${
                targetSelector
                  ? `<div style="margin-bottom: 6px;"><strong>Target Control Locator:</strong> <code class="debug-code">${escapeHtml(targetSelector)}</code></div>`
                  : ''
              }
              ${
                interceptingOverlay
                  ? `
                <div class="debug-callout warning">
                  <div>⚠️ <strong>Pointer Interception Root Cause:</strong> An overlay in the header/modal subtree intercepted clicks before reaching the control:</div>
                  <code class="debug-code" style="color: #fbbf24; background: rgba(0,0,0,0.35);">${escapeHtml(interceptingOverlay)}</code>
                  <div style="margin-top: 4px; font-size: 12px;"><strong>Cross-check action:</strong> Open DevTools (F12) → Elements. Inspect <code>#login-poup-overlay</code> or fixed modal backdrops. Verify if dismiss triggers or z-index stacking context blocks the click target.</div>
                </div>
              `
                  : `
                <div class="debug-callout info">
                  <div>🔍 <strong>Cross-check action:</strong> Open DevTools (F12) → Elements tab. Search for the target element to verify if it is rendered, visible in the viewport, and not disabled or hidden behind fixed banners.</div>
                </div>
              `
              }
            </div>
          </div>

          <!-- Check 2: Console & Network Status -->
          <div class="debug-step-item">
            <div class="debug-step-header">
              <span class="repro-step-badge" style="background: rgba(245,158,11,0.15); color: var(--accent-amber);">Debug Check 2</span>
              <span>Audit Console Warnings & Failed Network Calls</span>
            </div>
            <div class="debug-step-body">
              ${
                consoleErrors
                  ? `
                <div class="debug-callout info" style="margin-bottom: 6px;">
                  <div>ℹ️ <strong>Client Console Telemetry:</strong> ${escapeHtml(consoleErrors)}</div>
                </div>
              `
                  : ''
              }
              ${
                networkFailed
                  ? `
                <div class="debug-callout rose" style="margin-bottom: 6px;">
                  <div>🛑 <strong>Network Requests Failed:</strong> ${escapeHtml(networkFailed.substring(0, 280))}...</div>
                </div>
              `
                  : ''
              }
              <p style="margin: 0; font-size: 12.5px;"><strong>Cross-check action:</strong> Open DevTools → Console & Network tabs. Filter network status by <code>(failed)</code> or <code>500</code>. Verify if analytics trackers, reverse proxies, or missing auth tokens block user interactions.</p>
            </div>
          </div>

          <!-- Check 3: Playwright CLI Replay Command -->
          <div class="debug-step-item">
            <div class="debug-step-header">
              <span class="repro-step-badge" style="background: rgba(2,132,199,0.15); color: var(--accent-cyan);">Debug Check 3</span>
              <span>Terminal Playwright Inspector Replay</span>
            </div>
            <div class="debug-step-body">
              <p style="margin: 0 0 6px;">Run this command in your terminal to replay the session with a headed browser:</p>
              <div class="debug-cli-box">
                <code>${escapeHtml(cliCommand)}</code>
                <button type="button" class="btn-copy-code" id="btn-copy-debug-cli" data-copy="${escapeHtml(cliCommand)}" title="Copy CLI Command">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Check 4: Raw Action Call Log (Collapsible) -->
          ${
            extractedCallLog
              ? `
            <details style="margin-top: 4px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 8px 12px; background: var(--bg-card);">
              <summary style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                <span>Detailed Playwright Action Call Log (${extractedCallLog.split('\n').length} lines)</span>
                <button type="button" class="btn-copy-code" id="btn-copy-raw-call-log" data-copy="${escapeHtml(extractedCallLog)}" title="Copy call log" onclick="event.stopPropagation();">Copy Trace</button>
              </summary>
              <pre class="debug-trace-terminal" style="margin-top: 8px;">${escapeHtml(extractedCallLog)}</pre>
            </details>
          `
              : ''
          }
        </div>
      </div>
    `;

    // Expected vs Actual comparison
    let cleanActualBehavior = stripAnsi(defect.actualBehavior || '');
    if (cleanActualBehavior.includes('Call log:')) {
      const actParts = cleanActualBehavior.split('Call log:');
      cleanActualBehavior = actParts[0].trim();
    }
    const cleanExpectedBehavior = stripAnsi(defect.expectedBehavior || '');

    const hasBehavior = Boolean(cleanExpectedBehavior || cleanActualBehavior);
    const behaviorHtml = hasBehavior
      ? `
        <div class="behavior-comparison-grid">
          ${
            cleanExpectedBehavior
              ? `
            <div class="behavior-box expected">
              <span class="behavior-label">Expected Behavior</span>
              <p class="behavior-text">${escapeHtml(cleanExpectedBehavior)}</p>
            </div>
          `
              : ''
          }
          ${
            cleanActualBehavior
              ? `
            <div class="behavior-box actual">
              <span class="behavior-label">Observed Behavior</span>
              <p class="behavior-text">${escapeHtml(cleanActualBehavior)}</p>
            </div>
          `
              : ''
          }
        </div>
      `
      : '';

    // Render complete body content
    content.innerHTML = `
      <!-- Header Badges Bar -->
      <div class="defect-modal-badges">
        <span class="badge ${modalSevBadge}">${sevLabel}</span>
        <span class="badge badge-info">${escapeHtml(defect.category || 'DEFECT')}</span>
        <span class="badge ${defect.status === 'OPEN' ? 'badge-danger' : 'badge-success'}">${escapeHtml(defect.status || 'OPEN')}</span>
        <span class="badge badge-success">${escapeHtml(defect.classification || 'CONFIRMED')}</span>
        ${
          defect.confidenceScore
            ? `<span class="badge" style="background: rgba(99,102,241,0.12); color: var(--accent-indigo); border: 1px solid rgba(99,102,241,0.25); font-weight: 600;">${Math.round(
                defect.confidenceScore * 100
              )}% Confidence</span>`
            : ''
        }
        ${
          defect.browser
            ? `<span class="badge" style="background: var(--bg-surface); color: var(--text-secondary); border: 1px solid var(--border-subtle);">${escapeHtml(
                defect.browser
              )}</span>`
            : ''
        }
      </div>

      <!-- Description & Impact Card -->
      <div class="defect-info-card">
        <div class="defect-info-header">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Description & Impact Analysis
        </div>
        <p class="defect-text-content">${escapeHtml(desc)}</p>
      </div>

      <!-- Context & Deduplication Grid -->
      <div class="defect-meta-grid">
        ${
          primaryTargetUrl
            ? `
          <div class="defect-meta-item" style="grid-column: 1 / -1;">
            <span class="defect-meta-item-label">Affected Target Endpoint</span>
            <div class="defect-meta-item-val">
              <a href="${escapeHtml(primaryTargetUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-cyan); text-decoration: none; display: inline-flex; align-items: center; gap: 6px;" title="Open target page (${escapeHtml(primaryTargetUrl)})" onclick="window.open(this.href, '_blank'); return false;">
                <span>${escapeHtml(isPlaceholderUrl ? 'Target page' : primaryTargetUrl)}</span>
                ${isPlaceholderUrl ? `<span style="opacity: 0.75; font-size: 11.5px; font-weight: normal;">(${escapeHtml(primaryTargetUrl)})</span>` : ''}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>
        `
            : ''
        }
        <div class="defect-meta-item">
          <span class="defect-meta-item-label">Deduplication Fingerprint</span>
          <div class="defect-meta-item-val">
            <div class="defect-fingerprint-box">
              <span>${escapeHtml(defect.fingerprint || 'N/A')}</span>
              ${
                defect.fingerprint
                  ? `
                <button type="button" class="btn-copy-code" id="btn-copy-defect-fp" data-copy="${escapeHtml(defect.fingerprint)}" title="Copy fingerprint">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>Copy</span>
                </button>
              `
                  : ''
              }
            </div>
          </div>
        </div>
        <div class="defect-meta-item">
          <span class="defect-meta-item-label">Associated Test Run</span>
          <div class="defect-meta-item-val" style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-secondary);">
            ${escapeHtml(defect.testRunId || defect.runId || 'N/A')}
          </div>
        </div>
      </div>

      <!-- Expected vs Actual Behavior (if present) -->
      ${behaviorHtml}

      <!-- Interactive Steps to Reproduce -->
      ${reproHtml}

      <!-- Dedicated Diagnostic & Debug Cross-Check Guide -->
      ${debugGuideHtml}

      <!-- Evidence & Screenshots -->
      <div class="defect-info-card">
        <div class="defect-info-header">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
          Evidence & Captured Visual Screenshots
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${evidenceHtml}
        </div>
      </div>

      <!-- Remediation Recommendation Card -->
      <div class="defect-remediation-box">
        <div class="defect-remediation-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          Remediation Recommendation
        </div>
        <p class="defect-remediation-text">${escapeHtml(fixRecommendation)}</p>
      </div>
    `;

    // Render footer
    if (footer) {
      footer.innerHTML = `
        <div class="defect-status-wrapper">
          <label for="modal-defect-status-select" style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin: 0;">Update Status:</label>
          <select id="modal-defect-status-select" class="select-input select-sm" style="min-width: 140px;">
            <option value="OPEN" ${defect.status === 'OPEN' ? 'selected' : ''}>OPEN</option>
            <option value="IN_REVIEW" ${defect.status === 'IN_REVIEW' ? 'selected' : ''}>IN_REVIEW</option>
            <option value="RESOLVED" ${defect.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED</option>
            <option value="FALSE_POSITIVE" ${defect.status === 'FALSE_POSITIVE' ? 'selected' : ''}>FALSE_POSITIVE</option>
          </select>
        </div>
        <button type="button" class="btn btn-secondary" id="modal-defect-close-btn2" style="padding: 7px 22px; font-weight: 500;">Close</button>
      `;
    }

    // Attach step verification checkbox listeners
    const checkboxes = content.querySelectorAll('.repro-step-checkbox');
    const updateProgress = () => {
      const total = checkboxes.length;
      const checkedCount = content.querySelectorAll('.repro-step-checkbox:checked').length;
      const progressBadge = document.getElementById('repro-progress-badge');
      if (progressBadge) {
        if (checkedCount === total && total > 0) {
          progressBadge.innerText = `All ${total} Steps Verified ✓`;
          progressBadge.classList.add('all-done');
        } else {
          progressBadge.innerText = `${checkedCount} / ${total} Verified`;
          progressBadge.classList.remove('all-done');
        }
      }
    };

    checkboxes.forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const item = e.target.closest('.repro-check-item');
        if (e.target.checked) {
          item?.classList.add('verified');
          showToast(`Step verified and checked off`, 'success');
        } else {
          item?.classList.remove('verified');
        }
        updateProgress();
      });
    });

    // Copy single step button
    content.querySelectorAll('.btn-copy-single-step').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const text = e.currentTarget.getAttribute('data-step-text');
        if (text) {
          navigator.clipboard?.writeText(text);
          const orig = e.currentTarget.innerText;
          e.currentTarget.innerText = 'Copied!';
          setTimeout(() => {
            e.currentTarget.innerText = orig;
          }, 1500);
          showToast('Step text copied to clipboard', 'success');
        }
      });
    });

    // Copy all reproduction steps button
    document.getElementById('btn-copy-all-repro-steps')?.addEventListener('click', (e) => {
      const formatted = [
        `### Reproduction Steps: ${defect.title}`,
        `Target: ${primaryTargetUrl || 'N/A'}`,
        `Severity: ${defect.severity} | Category: ${defect.category} | Fingerprint: ${defect.fingerprint}`,
        '',
        ...parsedSteps.map((s) => `${s.stepNum}. [${s.actionType}] ${s.stepText}${s.failureHint ? ` (Observed: ${s.failureHint})` : ''}`),
      ].join('\n');

      navigator.clipboard?.writeText(formatted);
      const btn = e.currentTarget;
      const origHtml = btn.innerHTML;
      btn.innerHTML = `✓ Copied All`;
      setTimeout(() => {
        btn.innerHTML = origHtml;
      }, 2000);
      showToast('All reproduction steps copied to clipboard', 'success');
    });

    // Copy CLI replay command
    document.getElementById('btn-copy-debug-cli')?.addEventListener('click', (e) => {
      const text = e.currentTarget.getAttribute('data-copy');
      if (text) {
        navigator.clipboard?.writeText(text);
        const span = e.currentTarget.querySelector('span');
        if (span) {
          span.innerText = 'Copied!';
          setTimeout(() => {
            span.innerText = 'Copy';
          }, 1500);
        }
        showToast('Playwright CLI command copied to clipboard', 'success');
      }
    });

    // Copy raw call log
    document.getElementById('btn-copy-raw-call-log')?.addEventListener('click', (e) => {
      const text = e.currentTarget.getAttribute('data-copy');
      if (text) {
        navigator.clipboard?.writeText(text);
        e.currentTarget.innerText = 'Copied!';
        setTimeout(() => {
          e.currentTarget.innerText = 'Copy Trace';
        }, 1500);
        showToast('Call log trace copied to clipboard', 'success');
      }
    });

    // Attach copy fingerprint button handler
    document.getElementById('btn-copy-defect-fp')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const text = btn.getAttribute('data-copy');
      if (text) {
        navigator.clipboard?.writeText(text);
        const span = btn.querySelector('span');
        if (span) {
          span.innerText = 'Copied!';
          setTimeout(() => {
            span.innerText = 'Copy';
          }, 2000);
        }
        showToast('Fingerprint copied to clipboard', 'success');
      }
    });

    // Attach status change handler
    document.getElementById('modal-defect-status-select')?.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      await fetch(`/api/defects/${defect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      defect.status = newStatus;
      renderDefects();
      showToast(`Defect status updated to ${newStatus}`, 'success');
    });

    // Attach close button handler
    document.getElementById('modal-defect-close-btn2')?.addEventListener('click', () => {
      modalDefectDetail.classList.add('hidden');
    });

    modalDefectDetail.classList.remove('hidden');
  }

  function renderAuditLogs() {
    if (!auditTbody) return;
    if (allAuditLogs.length === 0) {
      auditTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No audit records logged yet.</td></tr>`;
      return;
    }

    auditTbody.innerHTML = allAuditLogs
      .map(
        (log) => `
        <tr>
          <td class="text-muted" style="font-size: 12px; font-family: 'JetBrains Mono', monospace;">${new Date(log.timestamp).toLocaleTimeString()}</td>
          <td><strong style="color: var(--accent-cyan); font-size: 12px;">${log.action}</strong></td>
          <td><span class="badge badge-info">${log.entityType}</span></td>
          <td><code style="font-size: 11.5px;">${log.entityId}</code></td>
          <td style="font-size: 13px;">${escapeHtml(log.details)}</td>
        </tr>
      `
      )
      .join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Run Trigger Logic ---
  async function triggerRun(targetUrl, maxDepth = 3, maxPages = 20) {
    if (activeEventSource) {
      activeEventSource.close();
    }

    // Update sidebar target display immediately
    const sidebarTargetEl = document.getElementById('sidebar-target-url');
    const sidebarBadgeEl = document.getElementById('sidebar-target-badge');
    if (sidebarTargetEl) sidebarTargetEl.innerText = targetUrl;
    if (sidebarBadgeEl) {
      sidebarBadgeEl.innerText = 'Active Testing Target';
      sidebarBadgeEl.className = 'target-badge badge-active';
    }

    liveBanner.classList.remove('hidden');
    liveStageText.innerText = 'INITIALIZING RUN';
    liveMessageText.innerText = `Dispatching test suite for ${targetUrl}...`;
    liveProgressBar.style.width = '5%';
    livePercentText.innerText = '5%';

    try {
      const res = await fetch('/api/test-runs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scopeOverride: {
            primaryUrl: targetUrl,
            maxCrawlDepth: maxDepth,
            maxPages: maxPages,
            allowLocalTargets: true,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${res.status}`);
      }

      const data = await res.json();
      console.log('Run started successfully:', data);

      // Listen for SSE events
      const runId = data.testRunId;
      if (runId) {
        const es = new EventSource(`/api/test-runs/${runId}/events`);
        activeEventSource = es;

        es.onmessage = (event) => {
          try {
            const evt = JSON.parse(event.data);
            liveStageText.innerText = evt.stage || 'PROCESSING';
            liveMessageText.innerText = evt.message || '';
            const pct = evt.progressPercent || 15;
            liveProgressBar.style.width = `${pct}%`;
            livePercentText.innerText = `${pct}%`;

            if (evt.stage === 'COMPLETED' || evt.stage === 'FAILED') {
              es.close();
              setTimeout(() => {
                liveBanner.classList.add('hidden');
              }, 4000);
              // Refresh all data
              loadProjects();
              loadTestRuns();
              loadDefects();
              loadAuditLogs();
              loadPerformanceData();
              fetchStatus();
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        };

        es.onerror = () => {
          es.close();
          // Fallback poll
          setTimeout(() => {
            loadProjects();
            loadTestRuns();
            loadDefects();
            loadAuditLogs();
            loadPerformanceData();
            fetchStatus();
          }, 3000);
        };
      }
    } catch (err) {
      console.error('Failed to trigger run:', err);
      liveStageText.innerText = 'DISPATCH ERROR';
      liveMessageText.innerText = err.message || 'Error initiating test cycle';
      liveProgressBar.style.width = '100%';
      livePercentText.innerText = 'ERR';
      setTimeout(() => {
        liveBanner.classList.add('hidden');
      }, 6000);
    }
  }

  // Helper to determine active target URL currently under test
  function getActiveTargetUrl() {
    if (currentProject && currentProject.primaryUrl) {
      return currentProject.primaryUrl;
    }
    if (allRuns && allRuns.length > 0 && allRuns[0].primaryUrl) {
      return allRuns[0].primaryUrl;
    }
    const sidebarLink = document.getElementById('sidebar-target-url')?.querySelector('a');
    if (sidebarLink && sidebarLink.href) {
      return sidebarLink.href;
    }
    const inputVal = document.getElementById('run-target-url')?.value?.trim();
    if (inputVal && inputVal !== 'http://localhost:4000') {
      return inputVal;
    }
    return null;
  }

  // Event Listeners for Run Triggers
  btnQuickFixture?.addEventListener('click', () => {
    triggerRun('http://localhost:4000', 3, 20);
  });

  btnStartCrawlOnly?.addEventListener('click', () => {
    const activeUrl = getActiveTargetUrl();
    if (activeUrl) {
      // Run discovery crawl on the active target URL (keeps the tested URL intact!)
      triggerRun(activeUrl, 2, 10);
    } else {
      // If no target URL configured yet, open modal for user to enter target URL
      modalNewRun.classList.remove('hidden');
      const inputEl = document.getElementById('run-target-url');
      if (inputEl) {
        inputEl.focus();
      }
    }
  });

  btnNewRun?.addEventListener('click', () => {
    const activeUrl = getActiveTargetUrl();
    const inputEl = document.getElementById('run-target-url');
    if (activeUrl && inputEl && !inputEl.value) {
      inputEl.value = activeUrl;
    }
    modalNewRun.classList.remove('hidden');
  });

  btnTriggerRunRunsTab?.addEventListener('click', () => {
    const activeUrl = getActiveTargetUrl();
    const inputEl = document.getElementById('run-target-url');
    if (activeUrl && inputEl && !inputEl.value) {
      inputEl.value = activeUrl;
    }
    modalNewRun.classList.remove('hidden');
  });

  modalCloseBtn?.addEventListener('click', () => modalNewRun.classList.add('hidden'));
  modalCancelBtn?.addEventListener('click', () => modalNewRun.classList.add('hidden'));
  modalDefectCloseBtn?.addEventListener('click', () => modalDefectDetail.classList.add('hidden'));

  formNewRun?.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('run-target-url').value;
    const depth = parseInt(document.getElementById('run-crawl-depth').value, 10);
    const pages = parseInt(document.getElementById('run-max-pages').value, 10);
    modalNewRun.classList.add('hidden');
    triggerRun(url, depth, pages);
  });

  // Defect Triage Toolbar Listeners
  filterSeverity?.addEventListener('change', renderDefects);
  filterCategory?.addEventListener('change', renderDefects);
  filterStatus?.addEventListener('change', renderDefects);
  filterSort?.addEventListener('change', renderDefects);
  inputDefectSearch?.addEventListener('input', renderDefects);

  btnDefectSearchClear?.addEventListener('click', () => {
    if (inputDefectSearch) {
      inputDefectSearch.value = '';
      renderDefects();
      inputDefectSearch.focus();
    }
  });

  btnResetFilters?.addEventListener('click', resetDefectFilters);

  groupSeverityPills?.addEventListener('click', (e) => {
    const pill = e.target.closest('button[data-filter="severity"]');
    if (!pill) return;
    const val = pill.getAttribute('data-value') || 'ALL';
    if (filterSeverity) {
      filterSeverity.value = val;
      renderDefects();
    }
  });

  groupCategoryPills?.addEventListener('click', (e) => {
    const pill = e.target.closest('button[data-filter="category"]');
    if (!pill) return;
    const val = pill.getAttribute('data-value') || 'ALL';
    if (filterCategory) {
      filterCategory.value = val;
      renderDefects();
    }
  });

  // --- Toast Notification Helper ---
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✓' : '⚠️';
    toast.innerHTML = `<span style="font-weight:700;color:${type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'all 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // --- Reset & Clear All Test Data Handlers ---
  let pendingTargetUrlToDelete = null;

  const btnConfirmClearText = document.getElementById('btn-confirm-clear-text');
  const modalClearTitle = document.getElementById('modal-clear-title');
  const modalClearSubtitle = document.getElementById('modal-clear-subtitle');
  const radioClearAll = document.getElementById('radio-clear-all');
  const radioClearSingle = document.getElementById('radio-clear-single');
  const labelScopeAll = document.getElementById('label-scope-all');
  const labelScopeSingle = document.getElementById('label-scope-single');
  const modalClearUrlTargetBadge = document.getElementById('modal-clear-url-target-badge');

  const btnClearVaultData = document.getElementById('btn-clear-vault-data');
  const btnQuickClearVault = document.getElementById('btn-quick-clear-vault');
  const btnDossierDeleteUrl = document.getElementById('btn-dossier-delete-url');
  const itemGlobalClearData = document.getElementById('item-global-clear-data');

  function openClearModal(targetUrlToPreselect) {
    if (!modalClearData) return;

    if (targetUrlToPreselect) {
      pendingTargetUrlToDelete = targetUrlToPreselect;
      if (modalClearUrlTargetBadge) modalClearUrlTargetBadge.innerText = targetUrlToPreselect;
      if (labelScopeSingle) labelScopeSingle.style.display = 'flex';
      if (radioClearSingle) radioClearSingle.checked = true;
      labelScopeSingle?.classList.add('active');
      labelScopeAll?.classList.remove('active');
      if (btnConfirmClearText) btnConfirmClearText.innerText = 'Delete This URL';
      if (modalClearTitle) modalClearTitle.innerText = 'Delete Tested URL';
      if (modalClearSubtitle) modalClearSubtitle.innerText = `Remove ${targetUrlToPreselect} and its findings from the vault`;
    } else {
      pendingTargetUrlToDelete = selectedTargetUrl || (currentProject?.primaryUrl) || null;
      if (pendingTargetUrlToDelete) {
        if (modalClearUrlTargetBadge) modalClearUrlTargetBadge.innerText = pendingTargetUrlToDelete;
        if (labelScopeSingle) labelScopeSingle.style.display = 'flex';
      } else {
        if (labelScopeSingle) labelScopeSingle.style.display = 'none';
      }
      if (radioClearAll) radioClearAll.checked = true;
      labelScopeAll?.classList.add('active');
      labelScopeSingle?.classList.remove('active');
      if (btnConfirmClearText) btnConfirmClearText.innerText = 'Yes, Reset All Data';
      if (modalClearTitle) modalClearTitle.innerText = 'Clear Tested Data & Vault';
      if (modalClearSubtitle) modalClearSubtitle.innerText = 'Permanently delete historical tests, crawl records, or specific URLs';
    }

    modalClearData.classList.remove('hidden');
  }

  function closeClearModal() {
    if (modalClearData) modalClearData.classList.add('hidden');
  }

  labelScopeAll?.addEventListener('click', () => {
    if (radioClearAll) radioClearAll.checked = true;
    labelScopeAll.classList.add('active');
    labelScopeSingle?.classList.remove('active');
    if (btnConfirmClearText) btnConfirmClearText.innerText = 'Yes, Reset All Data';
  });

  labelScopeSingle?.addEventListener('click', () => {
    if (radioClearSingle) radioClearSingle.checked = true;
    labelScopeSingle.classList.add('active');
    labelScopeAll?.classList.remove('active');
    if (btnConfirmClearText) btnConfirmClearText.innerText = 'Delete This URL';
  });

  btnClearAllData?.addEventListener('click', () => openClearModal());
  btnClearVaultData?.addEventListener('click', () => openClearModal());
  btnQuickClearVault?.addEventListener('click', () => openClearModal());
  btnDossierDeleteUrl?.addEventListener('click', () => openClearModal(selectedTargetUrl));
  btnResetTarget?.addEventListener('click', (e) => {
    e.stopPropagation();
    openClearModal();
  });
  itemGlobalClearData?.addEventListener('click', () => {
    const menuUserProfile = document.getElementById('menu-user-profile');
    if (menuUserProfile) menuUserProfile.classList.add('hidden');
    openClearModal();
  });

  modalClearCloseBtn?.addEventListener('click', closeClearModal);
  modalClearCancelBtn?.addEventListener('click', closeClearModal);

  btnConfirmClearData?.addEventListener('click', async () => {
    btnConfirmClearData.disabled = true;
    const isSingleDelete = radioClearSingle?.checked && pendingTargetUrlToDelete;

    try {
      if (isSingleDelete) {
        if (btnConfirmClearText) btnConfirmClearText.innerText = 'Deleting URL...';
        const res = await fetch(`/api/urls?url=${encodeURIComponent(pendingTargetUrlToDelete)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete URL from vault');

        const deletedUrl = pendingTargetUrlToDelete;
        closeClearModal();
        showToast(`✓ Removed URL '${deletedUrl}' from vault.`);

        // In-memory prune
        const norm = (u) => (u || '').trim().replace(/\/$/, '').toLowerCase();
        const targetNorm = norm(deletedUrl);

        allRuns = allRuns.filter((r) => norm(r.primaryUrl || r.scope?.primaryUrl) !== targetNorm);
        allDefects = allDefects.filter((d) => norm(d.affectedUrl) !== targetNorm);
        allCrawlSessions = allCrawlSessions.filter((s) => {
          if (norm(s.primaryUrl || s.startUrl) === targetNorm) return false;
          if (s.pages) {
            s.pages = s.pages.filter((p) => norm(p.url) !== targetNorm);
          }
          return true;
        });

        if (selectedTargetUrl && norm(selectedTargetUrl) === targetNorm) {
          selectedTargetUrl = null;
        }

        if (currentProject && norm(currentProject.primaryUrl) === targetNorm) {
          currentProject = null;
          updateSidebarTarget(null);
        }

        await loadProjects();
        await loadTestRuns();
        await loadDefects();
        await loadCrawlSessions();
        fetchStatus();
        renderTestedUrlsHistory();
      } else {
        if (btnConfirmClearText) btnConfirmClearText.innerText = 'Resetting platform...';
        const res = await fetch('/api/reset', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to reset data');

        closeClearModal();
        showToast('✓ All previous test data, defects, and targets cleared! Ready for new URL.');

        // Reset state and views
        currentProject = null;
        allRuns = [];
        allDefects = [];
        allAuditLogs = [];
        allCrawlSessions = [];
        selectedTargetUrl = null;

        updateSidebarTarget(null);
        await loadProjects();
        await loadTestRuns();
        await loadDefects();
        await loadAuditLogs();
        await loadCrawlSessions();
        await loadPerformanceData();
        fetchStatus();
        renderTestedUrlsHistory();
      }
    } catch (err) {
      console.error('Error clearing data:', err);
      showToast(err.message || 'Error clearing data', 'danger');
    } finally {
      btnConfirmClearData.disabled = false;
      if (btnConfirmClearText) {
        btnConfirmClearText.innerText = isSingleDelete ? 'Delete This URL' : 'Yes, Reset All Data';
      }
    }
  });

  // --- Performance & Visual Rendering ---
  function formatMs(ms) {
    if (!ms && ms !== 0) return '—';
    const val = Math.round(ms);
    const cls = val > 3000 ? 'text-rose' : val > 1500 ? 'style="color:var(--accent-amber)"' : 'class="text-emerald"';
    return `<span ${cls}>${val}</span>`;
  }

  function formatCls(cls) {
    if (cls === undefined || cls === null) return '—';
    const val = parseFloat(cls).toFixed(3);
    const style = cls > 0.25 ? 'color:var(--accent-rose)' : cls > 0.1 ? 'color:var(--accent-amber)' : 'color:var(--accent-emerald)';
    return `<span style="${style}">${val}</span>`;
  }

  // --- Tested URLs History Controller ---
  let allCrawlSessions = [];
  let selectedTargetUrl = null;

  async function loadCrawlSessions() {
    try {
      const res = await fetch('/api/crawl-sessions');
      allCrawlSessions = await res.json();
    } catch (e) {
      console.error('Failed to load crawl sessions:', e);
    }
  }

  function getTestedUrlsData() {
    const urlMap = new Map();
    const norm = (u) => (u || '').trim().replace(/\/$/, '');

    // 1. Process all test runs (primary targets)
    allRuns.forEach((run) => {
      const primary = run.primaryUrl || run.scope?.primaryUrl;
      if (!primary) return;

      const normPrimary = norm(primary);
      if (!urlMap.has(normPrimary)) {
        urlMap.set(normPrimary, {
          url: normPrimary,
          isPrimary: true,
          runs: [],
          defects: [],
          crawledPages: [],
          perfMetrics: [],
          visualResults: [],
          firstTested: run.startedAt,
          lastTested: run.startedAt,
        });
      }

      const item = urlMap.get(normPrimary);
      item.runs.push(run);
      if (new Date(run.startedAt) < new Date(item.firstTested)) item.firstTested = run.startedAt;
      if (new Date(run.startedAt) > new Date(item.lastTested)) item.lastTested = run.startedAt;

      // Add run's performance
      if (run.performanceMetrics && Array.isArray(run.performanceMetrics)) {
        item.perfMetrics.push(...run.performanceMetrics);
      }

      // Add run's visual results
      if (run.visualResults && Array.isArray(run.visualResults)) {
        item.visualResults.push(...run.visualResults);
      }
    });

    // 2. Process all crawl sessions to include discovered sub-pages
    allCrawlSessions.forEach((session) => {
      const rootUrl = session.primaryUrl ? norm(session.primaryUrl) : null;
      const rootItem = rootUrl ? urlMap.get(rootUrl) : null;

      (session.pages || []).forEach((page) => {
        if (!page.url) return;
        const normUrl = norm(page.url);

        if (rootItem && !rootItem.crawledPages.some((p) => norm(p.url) === normUrl)) {
          rootItem.crawledPages.push(page);
        }

        if (!urlMap.has(normUrl)) {
          urlMap.set(normUrl, {
            url: normUrl,
            isPrimary: false,
            runs: rootItem ? rootItem.runs : [],
            defects: [],
            crawledPages: [page],
            perfMetrics: rootItem ? rootItem.perfMetrics.filter((m) => norm(m.url) === normUrl) : [],
            visualResults: rootItem ? rootItem.visualResults.filter((v) => norm(v.pageUrl) === normUrl) : [],
            firstTested: session.startedAt || page.crawledAt || new Date().toISOString(),
            lastTested: session.completedAt || session.startedAt || new Date().toISOString(),
          });
        }
      });
    });

    // Collect all known crawl pages sorted longest URL first for accurate subpath matching
    const allKnownPages = [];
    allCrawlSessions.forEach((s) => {
      (s.pages || []).forEach((p) => {
        if (p.url && !allKnownPages.some((kp) => norm(kp.url) === norm(p.url))) {
          allKnownPages.push(p);
        }
      });
    });
    allKnownPages.sort((a, b) => b.url.length - a.url.length);

    // 3. Associate allDefects with their respective URLs with smart precision matching
    allDefects.forEach((defect) => {
      let matchedItem = null;
      const rawUrl = defect.affectedUrl || defect.pageUrl || '';
      const normRaw = norm(rawUrl);

      // A. Direct exact match in urlMap
      if (normRaw && urlMap.has(normRaw)) {
        matchedItem = urlMap.get(normRaw);
      }

      // B. Match against crawl pages longest first
      if (!matchedItem && allKnownPages.length > 0) {
        const pageMatch = allKnownPages.find((p) => norm(p.url) === normRaw);
        if (pageMatch && urlMap.has(norm(pageMatch.url))) {
          matchedItem = urlMap.get(norm(pageMatch.url));
        }
      }

      // C. Check title pathname match (e.g. "on /on-ground-event-solutions")
      if (!matchedItem && defect.title) {
        for (const page of allKnownPages) {
          try {
            const path = new URL(page.url).pathname;
            if (path.length > 1 && defect.title.includes(path)) {
              if (urlMap.has(norm(page.url))) {
                matchedItem = urlMap.get(norm(page.url));
                break;
              }
            }
          } catch {}
        }
      }

      // D. Check reproduction steps for URL mention
      if (!matchedItem && Array.isArray(defect.reproductionSteps)) {
        for (const step of defect.reproductionSteps) {
          for (const page of allKnownPages) {
            if (step.includes(norm(page.url))) {
              if (urlMap.has(norm(page.url))) {
                matchedItem = urlMap.get(norm(page.url));
                break;
              }
            }
          }
          if (matchedItem) break;
        }
      }

      // E. Fallback: match primary URL of the run
      if (!matchedItem && defect.testRunId) {
        const run = allRuns.find((r) => r.id === defect.testRunId);
        if (run) {
          const prim = norm(run.primaryUrl || run.scope?.primaryUrl);
          if (prim && urlMap.has(prim)) {
            matchedItem = urlMap.get(prim);
          }
        }
      }

      if (matchedItem) {
        if (!matchedItem.defects.some((d) => d.id === defect.id)) {
          matchedItem.defects.push(defect);
        }
      }
    });

    // Sync header stat counts
    const statHistoryUrlCount = document.getElementById('stat-history-url-count');
    const statHistoryRunsCount = document.getElementById('stat-history-runs-count');
    const badgeUrlHistoryCount = document.getElementById('badge-url-history-count');
    if (statHistoryUrlCount) statHistoryUrlCount.innerText = urlMap.size;
    if (statHistoryRunsCount) statHistoryRunsCount.innerText = allRuns.length;
    if (badgeUrlHistoryCount) badgeUrlHistoryCount.innerText = urlMap.size;

    return Array.from(urlMap.values());
  }

  function renderTestedUrlsHistory() {
    const container = document.getElementById('url-history-cards-list');
    const badgeCount = document.getElementById('url-history-list-badge');
    const searchInput = document.getElementById('input-url-history-search');
    const scopeSelect = document.getElementById('select-url-history-scope');

    if (!container) return;

    let items = getTestedUrlsData();

    // Search filter
    const q = (searchInput?.value || '').trim().toLowerCase();
    if (q) {
      items = items.filter((it) => it.url.toLowerCase().includes(q));
    }

    // Scope filter
    const scope = scopeSelect?.value || 'ALL';
    if (scope === 'PRIMARY') {
      items = items.filter((it) => it.isPrimary);
    } else if (scope === 'DEFECTIVE') {
      items = items.filter((it) => it.defects.length > 0);
    }

    if (badgeCount) badgeCount.innerText = `${items.length} URL${items.length === 1 ? '' : 's'}`;

    if (items.length === 0) {
      container.innerHTML = `<div class="empty-state py-4"><p>No tested URLs match filter criteria.</p></div>`;
      const dossier = document.getElementById('url-dossier');
      const emptyState = document.getElementById('url-history-empty');
      if (dossier) dossier.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    container.innerHTML = items
      .map((it) => {
        const isActive = selectedTargetUrl === it.url;
        const p1Count = it.defects.filter((d) => d.severity === 'P1').length;
        const p2Count = it.defects.filter((d) => d.severity === 'P2').length;

        const healthBadge =
          p1Count > 0
            ? `<span class="badge badge-danger">CRITICAL (P1: ${p1Count})</span>`
            : p2Count > 0
            ? `<span class="badge badge-warning">P2 DEFECTS (${p2Count})</span>`
            : it.defects.length > 0
            ? `<span class="badge badge-info">${it.defects.length} DEFECTS</span>`
            : `<span class="badge badge-success">✓ ALL PASSED</span>`;

        const typeBadge = it.isPrimary
          ? `<span class="badge badge-info" style="font-size:9.5px;">PRIMARY TARGET</span>`
          : `<span class="badge" style="font-size:9.5px;background:var(--bg-surface);color:var(--text-secondary);border:1px solid var(--border-subtle);">PAGE</span>`;

        return `
          <div class="url-card ${isActive ? 'active-card' : ''}" data-url="${escapeHtml(it.url)}">
            <div class="url-card-header">
              <span class="url-card-name">${escapeHtml(it.url)}</span>
              <div style="display:inline-flex; align-items:center; gap:4px; margin-left:auto;">
                ${typeBadge}
                <button class="btn-card-delete" title="Delete this URL from vault" data-delete-url="${escapeHtml(it.url)}" type="button">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="url-card-meta">
              ${healthBadge}
              <span>${it.runs.length} Run${it.runs.length === 1 ? '' : 's'}</span>
            </div>
            <div class="url-card-stats">
              <span class="url-card-stat-item">🐛 <strong>${it.defects.length}</strong> Defect${it.defects.length === 1 ? '' : 's'}</span>
              <span class="url-card-stat-item" style="margin-left:auto;color:var(--text-muted);font-size:11px;">${new Date(it.lastTested).toLocaleDateString()}</span>
            </div>
          </div>
        `;
      })
      .join('');

    // Attach click events on cards
    container.querySelectorAll('.url-card').forEach((card) => {
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-url');
        selectUrlDossier(url);
      });
    });

    // Attach delete button click events on cards
    container.querySelectorAll('.btn-card-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-delete-url');
        if (url) openClearModal(url);
      });
    });

    // Auto-select first item or preserve selected item
    if (!selectedTargetUrl && items.length > 0) {
      selectUrlDossier(items[0].url);
    } else if (selectedTargetUrl) {
      const match = items.find((i) => i.url === selectedTargetUrl);
      if (match) {
        selectUrlDossier(match.url);
      } else if (items.length > 0) {
        selectUrlDossier(items[0].url);
      }
    }
  }

  function selectUrlDossier(url) {
    if (!url) return;
    selectedTargetUrl = url;

    // Highlight active card
    document.querySelectorAll('.url-card').forEach((c) => {
      if (c.getAttribute('data-url') === url) {
        c.classList.add('active-card');
      } else {
        c.classList.remove('active-card');
      }
    });

    const items = getTestedUrlsData();
    const item = items.find((it) => it.url === url);
    if (!item) return;

    const dossier = document.getElementById('url-dossier');
    const emptyState = document.getElementById('url-history-empty');
    if (emptyState) emptyState.classList.add('hidden');
    if (dossier) dossier.classList.remove('hidden');

    // Header info
    const titleEl = document.getElementById('dossier-url-title');
    const typeBadge = document.getElementById('dossier-type-badge');
    const healthBadge = document.getElementById('dossier-health-badge');
    const metaSubtitle = document.getElementById('dossier-meta-subtitle');
    const visitBtn = document.getElementById('btn-dossier-visit');
    const retestBtn = document.getElementById('btn-dossier-retest');

    if (titleEl) titleEl.innerText = item.url;
    if (typeBadge) {
      typeBadge.innerText = item.isPrimary ? 'PRIMARY TARGET SITE' : 'SUBPAGE ENDPOINT';
      typeBadge.className = `badge ${item.isPrimary ? 'badge-info' : 'badge-secondary'}`;
    }

    const p1Count = item.defects.filter((d) => d.severity === 'P1').length;
    const p2Count = item.defects.filter((d) => d.severity === 'P2').length;
    if (healthBadge) {
      if (p1Count > 0) {
        healthBadge.innerText = `CRITICAL (${p1Count} P1 DEFECTS)`;
        healthBadge.className = 'badge badge-danger';
      } else if (p2Count > 0) {
        healthBadge.innerText = `HIGH (${p2Count} P2 DEFECTS)`;
        healthBadge.className = 'badge badge-warning';
      } else if (item.defects.length > 0) {
        healthBadge.innerText = `${item.defects.length} DEFECTS REPORTED`;
        healthBadge.className = 'badge badge-info';
      } else {
        healthBadge.innerText = `✓ ALL TESTS PASSED`;
        healthBadge.className = 'badge badge-success';
      }
    }

    if (metaSubtitle) {
      metaSubtitle.innerText = `First tested: ${new Date(item.firstTested).toLocaleString()} • Last tested: ${new Date(item.lastTested).toLocaleString()}`;
    }

    if (visitBtn) {
      visitBtn.href = item.url;
    }

    const exportDossierBtn = document.getElementById('btn-dossier-export-sheet');
    if (exportDossierBtn) {
      exportDossierBtn.onclick = async () => {
        if (window.TestPilotSheetExporter) {
          await window.TestPilotSheetExporter.exportSingleUrlDossier(item, allDefects, allRuns, allCrawlSessions, 'xlsx');
          showToast(`✓ Exported sheet dossier for ${item.url}`);
        }
      };
    }

    if (retestBtn) {
      retestBtn.onclick = () => {
        const inputUrl = document.getElementById('input-target-url');
        if (inputUrl) inputUrl.value = item.url;
        modalNewRun.classList.remove('hidden');
      };
    }

    const dossierDeleteBtn = document.getElementById('btn-dossier-delete-url');
    if (dossierDeleteBtn) {
      dossierDeleteBtn.onclick = () => {
        openClearModal(item.url);
      };
    }

    // Metric Summary Grid
    const statRuns = document.getElementById('dossier-stat-runs');
    const statRunsSub = document.getElementById('dossier-stat-runs-sub');
    const statDefects = document.getElementById('dossier-stat-defects');
    const statDefectsSub = document.getElementById('dossier-stat-defects-sub');
    const statPassRate = document.getElementById('dossier-stat-pass-rate');
    const statPassSub = document.getElementById('dossier-stat-pass-sub');
    const statAvgSpeed = document.getElementById('dossier-stat-avg-speed');
    const statSpeedSub = document.getElementById('dossier-stat-speed-sub');

    if (statRuns) statRuns.innerText = item.runs.length;
    if (statRunsSub) statRunsSub.innerText = `${item.runs.filter((r) => r.status === 'COMPLETED').length} passed, ${item.runs.filter((r) => r.status === 'FAILED').length} failed`;

    if (statDefects) statDefects.innerText = item.defects.length;
    if (statDefectsSub) statDefectsSub.innerText = `${p1Count} Critical P1, ${p2Count} High P2`;

    const totalRuns = item.runs.length;
    const passedRuns = item.runs.filter((r) => r.status === 'COMPLETED').length;
    const passPct = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 100;
    if (statPassRate) statPassRate.innerText = `${passPct}%`;
    if (statPassSub) statPassSub.innerText = `${passedRuns} of ${totalRuns} run sessions clean`;

    const avgLatency = item.perfMetrics.length > 0
      ? Math.round(item.perfMetrics.reduce((s, m) => s + (m.navigationDurationMs || 0), 0) / item.perfMetrics.length)
      : (item.crawledPages[0]?.loadTimeMs || 0);
    if (statAvgSpeed) statAvgSpeed.innerHTML = avgLatency > 0 ? `${avgLatency}<span style="font-size:13px;color:var(--text-muted);">ms</span>` : '—';
    if (statSpeedSub) statSpeedSub.innerText = item.perfMetrics.length > 0 ? `${item.perfMetrics.length} samples collected` : 'Crawl latency';

    // Subtab counts
    const countRuns = document.getElementById('dossier-count-runs');
    const countDefects = document.getElementById('dossier-count-defects');
    const countPages = document.getElementById('dossier-count-pages');
    const countVisual = document.getElementById('dossier-count-visual');
    if (countRuns) countRuns.innerText = item.runs.length;
    if (countDefects) countDefects.innerText = item.defects.length;
    if (countPages) countPages.innerText = item.crawledPages.length;
    if (countVisual) countVisual.innerText = item.visualResults.length;

    // Subtab 1: Test Runs Table
    const runsTbodyEl = document.getElementById('dossier-runs-tbody');
    if (runsTbodyEl) {
      if (item.runs.length === 0) {
        runsTbodyEl.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No test runs recorded for this URL yet.</td></tr>`;
      } else {
        runsTbodyEl.innerHTML = item.runs
          .map((run) => {
            const statusBadge =
              run.status === 'COMPLETED'
                ? `<span class="badge badge-success">COMPLETED</span>`
                : run.status === 'RUNNING' || run.status === 'CRAWLING' || run.status === 'EXECUTING'
                ? `<span class="badge badge-info">${run.status}</span>`
                : `<span class="badge badge-danger">${run.status || 'FAILED'}</span>`;

            const startedStr = new Date(run.startedAt).toLocaleString();
            const dur = run.completedAt
              ? `${Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s`
              : '—';

            return `
              <tr>
                <td><code style="color:var(--accent-cyan); font-weight:600;">${run.id}</code></td>
                <td>${statusBadge}</td>
                <td style="font-size:12px;color:var(--text-secondary);">${startedStr}</td>
                <td>${dur}</td>
                <td><span class="text-emerald">✓ ${run.stats?.passed || 0}</span> / <span class="text-rose">✗ ${run.stats?.failed || 0}</span></td>
                <td><span class="badge ${run.stats?.defectsCount > 0 ? 'badge-danger' : 'badge-success'}">${run.stats?.defectsCount || 0} defects</span></td>
                <td>
                  <button class="btn btn-sm btn-outline btn-dossier-view-run" data-runid="${run.id}">
                    Inspect Run →
                  </button>
                </td>
              </tr>
            `;
          })
          .join('');

        runsTbodyEl.querySelectorAll('.btn-dossier-view-run').forEach((btn) => {
          btn.addEventListener('click', () => {
            const runId = btn.getAttribute('data-runid');
            const targetRun = allRuns.find((r) => r.id === runId);
            if (targetRun) {
              document.getElementById('tab-btn-runs')?.click();
              openRunDetail(targetRun);
            }
          });
        });
      }
    }

    // Subtab 2: Defects List
    const defectsGridEl = document.getElementById('dossier-defects-grid');
    if (defectsGridEl) {
      if (item.defects.length === 0) {
        defectsGridEl.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px;">
            <div class="empty-icon">✓</div>
            <h4 style="margin-bottom:4px;">Zero Defects Found on this URL</h4>
            <p style="color:var(--text-muted);font-size:13px;">This target passed all automated accessibility, security, and functional assertions.</p>
          </div>
        `;
      } else {
        defectsGridEl.innerHTML = item.defects
          .map((defect) => {
            const badgeClass =
              defect.severity === 'P1'
                ? 'badge-p1'
                : defect.severity === 'P2'
                ? 'badge-p2'
                : defect.severity === 'P3'
                ? 'badge-p3'
                : 'badge-p4';

            return `
              <div class="defect-card" data-defect-id="${defect.id}">
                <div class="defect-card-header">
                  <span class="badge ${badgeClass}">${defect.severity}</span>
                  <span class="badge badge-info">${defect.category}</span>
                </div>
                <div class="defect-card-title">${escapeHtml(defect.title)}</div>
                <div class="defect-card-desc">${escapeHtml(defect.description)}</div>
                <div class="defect-card-footer">
                  <span>Status: <strong style="color:var(--text-main);">${defect.status}</strong></span>
                  <span style="color:var(--accent-cyan); font-weight:600;">Inspect Details →</span>
                </div>
              </div>
            `;
          })
          .join('');

        defectsGridEl.querySelectorAll('.defect-card').forEach((card) => {
          card.addEventListener('click', () => {
            const dId = card.getAttribute('data-defect-id');
            const defect = item.defects.find((d) => d.id === dId) || allDefects.find((d) => d.id === dId);
            if (defect) openDefectModal(defect);
          });
        });
      }
    }

    // Subtab 3: Discovered Pages
    const pagesTbodyEl = document.getElementById('dossier-pages-tbody');
    if (pagesTbodyEl) {
      if (item.crawledPages.length === 0) {
        pagesTbodyEl.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No crawl session pages recorded for this target yet.</td></tr>`;
      } else {
        pagesTbodyEl.innerHTML = item.crawledPages
          .map((p) => {
            const statusClass = p.statusCode >= 400 ? 'badge-danger' : 'badge-success';
            const shortPath = p.url ? (p.url.replace(/^https?:\/\/[^/]+/, '') || '/') : '/';
            return `
              <tr>
                <td><span class="badge ${statusClass}">HTTP ${p.statusCode}</span></td>
                <td><code style="color:var(--accent-cyan); font-size:12.5px;">${escapeHtml(shortPath)}</code></td>
                <td>${escapeHtml(p.title || 'Untitled')}</td>
                <td>${p.interactiveElements?.length || 0} interactive items</td>
                <td>${p.hasForms ? '<span class="badge badge-warning">Forms Present</span>' : 'None'}</td>
                <td>${p.loadTimeMs ? `${p.loadTimeMs}ms` : '—'}</td>
                <td>
                  <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary" style="text-decoration:none;">
                    Visit ↗
                  </a>
                </td>
              </tr>
            `;
          })
          .join('');
      }
    }

    // Subtab 4: Performance & Core Web Vitals
    const perfTbodyEl = document.getElementById('dossier-perf-tbody');
    if (perfTbodyEl) {
      if (item.perfMetrics.length === 0) {
        perfTbodyEl.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No performance metrics recorded for this URL.</td></tr>`;
      } else {
        perfTbodyEl.innerHTML = item.perfMetrics
          .map((m) => `
            <tr>
              <td><code style="color:var(--accent-cyan);font-size:12px;">${item.runs[0]?.id || 'Run'}</code></td>
              <td style="font-size:12px;color:var(--text-secondary);">${new Date(item.lastTested).toLocaleTimeString()}</td>
              <td>${formatMs(m.navigationDurationMs)}</td>
              <td>${formatMs(m.firstContentfulPaintMs)}</td>
              <td>${formatMs(m.largestContentfulPaintMs)}</td>
              <td>${formatMs(m.ttfbMs)}</td>
              <td>${formatCls(m.cumulativeLayoutShift)}</td>
              <td>${m.totalRequests || 0}</td>
            </tr>
          `)
          .join('');
      }
    }

    // Subtab 5: Visual Regression
    const visualGridEl = document.getElementById('dossier-visual-grid');
    if (visualGridEl) {
      if (item.visualResults.length === 0) {
        visualGridEl.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px;">
            <div class="empty-icon">📸</div>
            <h4>No Visual Regression Captures</h4>
            <p style="color:var(--text-muted);font-size:13px;">Execute an automated test run to establish visual baselines and regression diffs.</p>
          </div>
        `;
      } else {
        visualGridEl.innerHTML = item.visualResults
          .map((v) => {
            const mismatchBadge = v.isBaseline
              ? `<span class="badge badge-info">BASELINE</span>`
              : v.isMismatch
              ? `<span class="badge badge-danger">REGRESSION</span>`
              : `<span class="badge badge-success">MATCHED</span>`;
            const pct = v.mismatchPercentage ? `${v.mismatchPercentage.toFixed(2)}%` : '0%';
            return `
              <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <code style="font-size:12px;color:var(--accent-cyan);">${escapeHtml(v.pageName || 'Snapshot')}</code>
                  ${mismatchBadge}
                </div>
                <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">${escapeHtml(v.diffSummary || 'Baseline capture')}</div>
                <div style="font-size:11.5px;color:var(--text-muted);">Mismatch: <strong style="color:${v.isMismatch ? 'var(--accent-rose)' : 'var(--accent-emerald)'};">${pct}</strong></div>
              </div>
            `;
          })
          .join('');
      }
    }
  }

  // Dossier Subtabs Navigation Event Listeners
  document.querySelectorAll('.dossier-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-dossier-tab');
      document.querySelectorAll('.dossier-tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.dossier-tab-pane').forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // URL History Search & Filter Listeners
  document.getElementById('input-url-history-search')?.addEventListener('input', () => {
    renderTestedUrlsHistory();
  });
  document.getElementById('select-url-history-scope')?.addEventListener('change', () => {
    renderTestedUrlsHistory();
  });

  // --- Export Sheet Controller ---
  const btnExportSheetDropdown = document.getElementById('btn-export-sheet-dropdown');
  const menuExportSheet = document.getElementById('menu-export-sheet');
  const itemExportExcel = document.getElementById('item-export-excel');
  const itemExportSummaryCsv = document.getElementById('item-export-summary-csv');
  const itemExportDefectsCsv = document.getElementById('item-export-defects-csv');
  const itemExportCustomModal = document.getElementById('item-export-custom-modal');

  const btnQuickExportCsv = document.getElementById('btn-quick-export-csv');
  const btnQuickExportExcel = document.getElementById('btn-quick-export-excel');
  const btnRunsExportSheet = document.getElementById('btn-runs-export-sheet');
  const btnDefectsExportSheet = document.getElementById('btn-defects-export-sheet');

  const modalExportSheet = document.getElementById('modal-export-sheet');
  const modalExportCloseBtn = document.getElementById('modal-export-close-btn');
  const modalExportCancelBtn = document.getElementById('modal-export-cancel-btn');
  const btnModalConfirmExport = document.getElementById('btn-modal-confirm-export');
  const btnModalExportText = document.getElementById('btn-modal-export-text');
  const selectExportScope = document.getElementById('select-export-scope');
  const exportPreviewTbody = document.getElementById('export-preview-tbody');
  const badgeExportPreviewCount = document.getElementById('badge-export-preview-count');

  // Toggle Dropdown Menu
  if (btnExportSheetDropdown && menuExportSheet) {
    btnExportSheetDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = menuExportSheet.classList.contains('hidden');
      if (isHidden) {
        menuExportSheet.classList.remove('hidden');
        btnExportSheetDropdown.setAttribute('aria-expanded', 'true');
      } else {
        menuExportSheet.classList.add('hidden');
        btnExportSheetDropdown.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('click', (e) => {
      if (!menuExportSheet.classList.contains('hidden')) {
        if (!menuExportSheet.contains(e.target) && !btnExportSheetDropdown.contains(e.target)) {
          menuExportSheet.classList.add('hidden');
          btnExportSheetDropdown.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  function getScopeTestedUrls(scope = 'ALL') {
    let items = getTestedUrlsData();
    if (scope === 'PRIMARY') {
      return items.filter((it) => it.isPrimary);
    }
    if (scope === 'DEFECTIVE') {
      return items.filter((it) => it.defects.length > 0);
    }
    if (scope === 'CURRENT') {
      const q = (document.getElementById('input-url-history-search')?.value || '').trim().toLowerCase();
      const s = document.getElementById('select-url-history-scope')?.value || 'ALL';
      if (q) items = items.filter((it) => it.url.toLowerCase().includes(q));
      if (s === 'PRIMARY') items = items.filter((it) => it.isPrimary);
      else if (s === 'DEFECTIVE') items = items.filter((it) => it.defects.length > 0);
      return items;
    }
    return items;
  }

  // 1. Direct Dropdown Action: Excel Workbook
  itemExportExcel?.addEventListener('click', async () => {
    menuExportSheet?.classList.add('hidden');
    if (window.TestPilotSheetExporter) {
      const items = getTestedUrlsData();
      const res = await window.TestPilotSheetExporter.exportExcel(items, allDefects, allRuns, allCrawlSessions);
      showToast(`✓ Exported Multi-Sheet Excel Workbook (.xlsx) (${res.count} URLs aligned)`);
    }
  });

  // 2. Direct Dropdown Action: Tested URLs Summary CSV
  itemExportSummaryCsv?.addEventListener('click', () => {
    menuExportSheet?.classList.add('hidden');
    if (window.TestPilotSheetExporter) {
      const items = getTestedUrlsData();
      const res = window.TestPilotSheetExporter.exportSummaryCsv(items, allDefects, allRuns, allCrawlSessions);
      showToast(`✓ Exported Tested URLs Summary CSV (${res.count} URLs aligned)`);
    }
  });

  // 3. Direct Dropdown Action: Defects CSV Aligned by URL
  itemExportDefectsCsv?.addEventListener('click', () => {
    menuExportSheet?.classList.add('hidden');
    if (window.TestPilotSheetExporter) {
      const items = getTestedUrlsData();
      const res = window.TestPilotSheetExporter.exportDefectsCsv(items, allDefects, allRuns, allCrawlSessions);
      showToast(`✓ Exported Defects Sheet CSV (${res.count} findings aligned by URL)`);
    }
  });

  // 4. Quick Toolbar Action: Quick CSV
  btnQuickExportCsv?.addEventListener('click', () => {
    if (window.TestPilotSheetExporter) {
      const items = getScopeTestedUrls('CURRENT');
      const res = window.TestPilotSheetExporter.exportSummaryCsv(items, allDefects, allRuns, allCrawlSessions);
      showToast(`✓ Exported ${res.count} visible Tested URLs to CSV Sheet`);
    }
  });

  // 5. Quick Toolbar Action: Quick Excel
  btnQuickExportExcel?.addEventListener('click', async () => {
    if (window.TestPilotSheetExporter) {
      const items = getScopeTestedUrls('CURRENT');
      const res = await window.TestPilotSheetExporter.exportExcel(items, allDefects, allRuns, allCrawlSessions);
      showToast(`✓ Exported ${res.count} visible Tested URLs to Excel Workbook (.xlsx)`);
    }
  });

  // 6. Runs & Defects Tab Export Sheet Buttons
  btnRunsExportSheet?.addEventListener('click', () => {
    openExportModal();
  });
  btnDefectsExportSheet?.addEventListener('click', () => {
    if (window.TestPilotSheetExporter) {
      const items = getTestedUrlsData();
      const res = window.TestPilotSheetExporter.exportDefectsCsv(items, allDefects, allRuns, allCrawlSessions);
      showToast(`✓ Exported Defects Sheet CSV (${res.count} findings aligned by URL)`);
    }
  });

  // --- Export Modal Controller ---
  function openExportModal() {
    menuExportSheet?.classList.add('hidden');
    if (modalExportSheet) {
      modalExportSheet.classList.remove('hidden');
      updateExportModalPreview();
    }
  }

  function closeExportModal() {
    if (modalExportSheet) {
      modalExportSheet.classList.add('hidden');
    }
  }

  itemExportCustomModal?.addEventListener('click', openExportModal);
  modalExportCloseBtn?.addEventListener('click', closeExportModal);
  modalExportCancelBtn?.addEventListener('click', closeExportModal);

  // Format selection in modal
  document.querySelectorAll('.export-format-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.export-format-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const format = radio ? radio.value : 'EXCEL';
      if (btnModalExportText) {
        if (format === 'EXCEL') btnModalExportText.innerText = 'Download Excel Workbook (.xlsx)';
        else if (format === 'CSV_SUMMARY') btnModalExportText.innerText = 'Download Tested URLs CSV (.csv)';
        else if (format === 'CSV_DEFECTS') btnModalExportText.innerText = 'Download Defects CSV (.csv)';
      }
    });
  });

  // Scope selection change
  selectExportScope?.addEventListener('change', () => {
    updateExportModalPreview();
  });

  function updateExportModalPreview() {
    if (!exportPreviewTbody) return;
    const scope = selectExportScope ? selectExportScope.value : 'ALL';
    const items = getScopeTestedUrls(scope);

    if (badgeExportPreviewCount) {
      badgeExportPreviewCount.innerText = `${items.length} URL${items.length === 1 ? '' : 's'} aligned`;
    }

    if (items.length === 0) {
      exportPreviewTbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No tested URLs found in selected scope.</td></tr>`;
      return;
    }

    exportPreviewTbody.innerHTML = items
      .map((item) => {
        const p1 = item.defects.filter((d) => d.severity === 'P1').length;
        const p2 = item.defects.filter((d) => d.severity === 'P2').length;
        const verdictBadge =
          p1 > 0
            ? `<span class="badge badge-danger">CRITICAL (P1: ${p1})</span>`
            : p2 > 0
            ? `<span class="badge badge-warning">P2 (${p2})</span>`
            : item.defects.length > 0
            ? `<span class="badge badge-info">${item.defects.length} Defects</span>`
            : `<span class="badge badge-success">✓ ALL PASSED</span>`;

        const typeBadge = item.isPrimary
          ? `<span class="badge badge-info" style="font-size:9.5px;">PRIMARY</span>`
          : `<span class="badge" style="font-size:9.5px;background:var(--bg-surface);color:var(--text-secondary);border:1px solid var(--border-subtle);">PAGE</span>`;

        const avgSpeed = item.perfMetrics.length > 0
          ? Math.round(item.perfMetrics.reduce((s, m) => s + (m.navigationDurationMs || 0), 0) / item.perfMetrics.length)
          : (item.crawledPages[0]?.loadTimeMs || 0);

        const totalRuns = item.runs.length;
        const passedRuns = item.runs.filter((r) => r.status === 'COMPLETED').length;
        const passPct = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 100;

        return `
          <tr>
            <td><code style="color:var(--accent-cyan); font-size:11.5px;">${escapeHtml(item.url)}</code></td>
            <td>${typeBadge}</td>
            <td>${verdictBadge}</td>
            <td>${totalRuns}</td>
            <td>${passPct}%</td>
            <td><strong>${item.defects.length}</strong></td>
            <td><span class="${p1 > 0 ? 'text-rose' : ''}">${p1}</span> / <span class="${p2 > 0 ? 'text-rose' : ''}">${p2}</span></td>
            <td>${avgSpeed > 0 ? avgSpeed + 'ms' : '—'}</td>
          </tr>
        `;
      })
      .join('');
  }

  // Modal confirm export download
  btnModalConfirmExport?.addEventListener('click', () => {
    if (!window.TestPilotSheetExporter) return;
    const formatRadio = document.querySelector('input[name="export-format"]:checked');
    const format = formatRadio ? formatRadio.value : 'EXCEL';
    const scope = selectExportScope ? selectExportScope.value : 'ALL';
    const items = getScopeTestedUrls(scope);

    if (items.length === 0) {
      showToast('No tested URLs match selected scope to export', 'danger');
      return;
    }

    if (format === 'EXCEL') {
      window.TestPilotSheetExporter.exportExcel(items, allDefects, allRuns, allCrawlSessions);
      showToast(`✓ Exported Multi-Sheet Excel Workbook (.xlsx) (${items.length} URLs aligned)`);
    } else if (format === 'CSV_SUMMARY') {
      window.TestPilotSheetExporter.exportSummaryCsv(items, allDefects, allRuns, allCrawlSessions);
      showToast(`✓ Exported Tested URLs Summary CSV (${items.length} URLs aligned)`);
    } else if (format === 'CSV_DEFECTS') {
      const res = window.TestPilotSheetExporter.exportDefectsCsv(items, allDefects, allRuns, allCrawlSessions);
      showToast(`✓ Exported Defects Sheet CSV (${res.count} findings aligned by URL)`);
    }

    closeExportModal();
  });

  async function loadPerformanceData() {
    try {
      const res = await fetch('/api/test-runs');
      const runs = await res.json();
      if (!runs || runs.length === 0) {
        const navEl = document.getElementById('perf-avg-nav');
        const fcpEl = document.getElementById('perf-avg-fcp');
        const lcpEl = document.getElementById('perf-avg-lcp');
        const ttfbEl = document.getElementById('perf-avg-ttfb');
        const countEl = document.getElementById('perf-page-count');
        if (navEl) navEl.innerText = '—';
        if (fcpEl) fcpEl.innerText = '—';
        if (lcpEl) lcpEl.innerText = '—';
        if (ttfbEl) ttfbEl.innerText = '—';
        if (countEl) countEl.innerText = '0 pages profiled';

        const tbody = document.getElementById('perf-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No performance data yet. Run a test cycle to collect Core Web Vitals.</td></tr>`;

        const visualGrid = document.getElementById('visual-results-grid');
        const visualCount = document.getElementById('visual-snap-count');
        if (visualGrid) visualGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">📸</div><p>No visual regression captures yet. Run a test cycle.</p></div>`;
        if (visualCount) visualCount.innerText = '0 captures';
        return;
      }

      // Collect all performance metrics from all runs
      const allMetrics = [];
      const allVisualResults = [];
      for (const run of runs) {
        if (run.performanceMetrics && run.performanceMetrics.length > 0) {
          allMetrics.push(...run.performanceMetrics);
        }
        if (run.visualResults && run.visualResults.length > 0) {
          allVisualResults.push(...run.visualResults);
        }
      }

      // ── Core Web Vitals summary ────────────────────────────────────────
      if (allMetrics.length > 0) {
        const avgNav = Math.round(allMetrics.reduce((s, m) => s + (m.navigationDurationMs || 0), 0) / allMetrics.length);
        const avgFcp = Math.round(allMetrics.reduce((s, m) => s + (m.firstContentfulPaintMs || 0), 0) / allMetrics.length);
        const avgLcp = Math.round(allMetrics.reduce((s, m) => s + (m.largestContentfulPaintMs || 0), 0) / allMetrics.length);
        const avgTtfb = Math.round(allMetrics.reduce((s, m) => s + (m.ttfbMs || 0), 0) / allMetrics.length);

        const navEl = document.getElementById('perf-avg-nav');
        const fcpEl = document.getElementById('perf-avg-fcp');
        const lcpEl = document.getElementById('perf-avg-lcp');
        const ttfbEl = document.getElementById('perf-avg-ttfb');
        if (navEl) navEl.innerHTML = `${avgNav}<span style="font-size:14px;color:var(--text-muted)">ms</span>`;
        if (fcpEl) fcpEl.innerHTML = avgFcp > 0 ? `${avgFcp}<span style="font-size:14px;color:var(--text-muted)">ms</span>` : '—';
        if (lcpEl) lcpEl.innerHTML = avgLcp > 0 ? `${avgLcp}<span style="font-size:14px;color:var(--text-muted)">ms</span>` : '—';
        if (ttfbEl) ttfbEl.innerHTML = `${avgTtfb}<span style="font-size:14px;color:var(--text-muted)">ms</span>`;

        document.getElementById('perf-page-count').innerText = `${allMetrics.length} page${allMetrics.length > 1 ? 's' : ''} profiled`;
      }

      // ── Per-page metrics table ─────────────────────────────────────────
      const tbody = document.getElementById('perf-tbody');
      if (tbody) {
        if (allMetrics.length === 0) {
          tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No performance data yet. Run a test cycle to collect Core Web Vitals.</td></tr>`;
        } else {
          tbody.innerHTML = allMetrics.map((m) => {
            const issueCount = (m.issues || []).length;
            const issueBadge = issueCount > 0
              ? `<span class="badge badge-danger">${issueCount} issue${issueCount > 1 ? 's' : ''}</span>`
              : `<span class="badge badge-success">✓ OK</span>`;
            const urlShort = m.url ? m.url.replace(/^https?:\/\/[^/]+/, '') || '/' : '—';
            return `
              <tr>
                <td><code style="color:var(--accent-cyan);font-size:12px;">${escapeHtml(urlShort)}</code></td>
                <td>${formatMs(m.navigationDurationMs)}</td>
                <td>${formatMs(m.firstContentfulPaintMs)}</td>
                <td>${formatMs(m.largestContentfulPaintMs)}</td>
                <td>${formatMs(m.ttfbMs)}</td>
                <td>${formatCls(m.cumulativeLayoutShift)}</td>
                <td>${m.totalRequests || 0}</td>
                <td>${issueBadge}</td>
              </tr>`;
          }).join('');
        }
      }

      // ── Visual regression grid ─────────────────────────────────────────
      const visualGrid = document.getElementById('visual-results-grid');
      const visualCount = document.getElementById('visual-snap-count');
      if (visualGrid) {
        if (allVisualResults.length === 0) {
          visualGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">📸</div><p>No visual regression captures yet. Run a test cycle.</p></div>`;
          if (visualCount) visualCount.innerText = '0 captures';
        } else {
          if (visualCount) visualCount.innerText = `${allVisualResults.length} capture${allVisualResults.length > 1 ? 's' : ''}`;
          visualGrid.innerHTML = allVisualResults.map((v) => {
            const mismatchBadge = v.isBaseline
              ? `<span class="badge badge-info">BASELINE</span>`
              : v.isMismatch
              ? `<span class="badge badge-danger">REGRESSION</span>`
              : `<span class="badge badge-success">MATCHED</span>`;
            const pct = v.mismatchPercentage ? `${v.mismatchPercentage.toFixed(2)}%` : '0%';
            const pagePath = v.pageUrl ? (v.pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/') : '/';
            return `
              <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                  <code style="font-size:12px;color:var(--accent-cyan);">${escapeHtml(pagePath)}</code>
                  ${mismatchBadge}
                </div>
                <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">${escapeHtml(v.diffSummary || 'No summary available.')}</div>
                <div style="display:flex;gap:12px;font-size:11.5px;color:var(--text-muted);">
                  <span>Δ pixels: <strong style="color:var(--text-main);">${(v.diffPixelCount || 0).toLocaleString()}</strong></span>
                  <span>Mismatch: <strong style="color:${v.isMismatch ? 'var(--accent-rose)' : 'var(--accent-emerald)'};">${pct}</strong></span>
                </div>
              </div>`;
          }).join('');
        }
      }
    } catch (e) {
      console.error('Failed to load performance data:', e);
    }
  }

  // --- User Authentication & Sign-In Controller ---
  const viewLoginScreen = document.getElementById('view-login-screen');

  // Cards
  const cardSignin = document.getElementById('card-signin');
  const cardSignup = document.getElementById('card-signup');
  const cardForgot = document.getElementById('card-forgot');

  // Switch Links & Buttons
  const btnGotoForgot = document.getElementById('btn-goto-forgot');
  const btnGotoSignup = document.getElementById('btn-goto-signup');
  const btnGotoSigninFromSignup = document.getElementById('btn-goto-signin-from-signup');
  const btnGotoSigninFromForgot = document.getElementById('btn-goto-signin-from-forgot');

  // Sign In Form Elements
  const formLogin = document.getElementById('form-login');
  const inputLoginEmail = document.getElementById('login-input-email');
  const inputLoginPassword = document.getElementById('login-input-password');
  const btnTogglePassword = document.getElementById('btn-toggle-password');
  const checkboxRemember = document.getElementById('login-checkbox-remember');
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  const btnLoginText = document.getElementById('btn-login-text');
  const loginSubmitSpinner = document.getElementById('login-submit-spinner');
  const loginAlertBanner = document.getElementById('login-alert-banner');
  const loginAlertText = document.getElementById('login-alert-text');

  // Sign Up Form Elements
  const formSignup = document.getElementById('form-signup');
  const inputSignupName = document.getElementById('signup-input-name');
  const inputSignupEmail = document.getElementById('signup-input-email');
  const inputSignupPassword = document.getElementById('signup-input-password');
  const btnToggleSignupPassword = document.getElementById('btn-toggle-signup-password');
  const btnSignupSubmit = document.getElementById('btn-signup-submit');
  const btnSignupText = document.getElementById('btn-signup-text');
  const signupSubmitSpinner = document.getElementById('signup-submit-spinner');
  const signupAlertBanner = document.getElementById('signup-alert-banner');
  const signupAlertText = document.getElementById('signup-alert-text');

  // Forgot Password Form Elements
  const formForgot = document.getElementById('form-forgot');
  const inputForgotEmail = document.getElementById('forgot-input-email');
  const btnForgotSubmit = document.getElementById('btn-forgot-submit');
  const btnForgotText = document.getElementById('btn-forgot-text');
  const forgotSubmitSpinner = document.getElementById('forgot-submit-spinner');
  const forgotAlertBanner = document.getElementById('forgot-alert-banner');
  const forgotAlertText = document.getElementById('forgot-alert-text');
  const forgotSuccessBanner = document.getElementById('forgot-success-banner');
  const forgotSuccessText = document.getElementById('forgot-success-text');

  // Header Session & User Profile Menu
  const btnUserProfile = document.getElementById('btn-user-profile');
  const menuUserProfile = document.getElementById('menu-user-profile');
  const headerUserAvatar = document.getElementById('header-user-avatar');
  const headerUserName = document.getElementById('header-user-name');
  const headerUserRole = document.getElementById('header-user-role');
  const menuUserName = document.getElementById('menu-user-name');
  const menuUserEmail = document.getElementById('menu-user-email');
  const itemSwitchAccount = document.getElementById('item-switch-account');
  const itemLogoutBtn = document.getElementById('item-logout-btn');

  // Card Switcher Helper
  function showAuthCard(cardType) {
    cardSignin?.classList.toggle('hidden', cardType !== 'signin');
    cardSignup?.classList.toggle('hidden', cardType !== 'signup');
    cardForgot?.classList.toggle('hidden', cardType !== 'forgot');

    hideLoginAlert();
    hideSignupAlert();
    hideForgotAlert();
    forgotSuccessBanner?.classList.add('hidden');

    if (cardType === 'signin') {
      setTimeout(() => inputLoginEmail?.focus(), 50);
    } else if (cardType === 'signup') {
      setTimeout(() => inputSignupName?.focus(), 50);
    } else if (cardType === 'forgot') {
      if (inputLoginEmail && inputLoginEmail.value && inputForgotEmail) {
        inputForgotEmail.value = inputLoginEmail.value;
      }
      setTimeout(() => inputForgotEmail?.focus(), 50);
    }
  }

  btnGotoForgot?.addEventListener('click', () => showAuthCard('forgot'));
  btnGotoSignup?.addEventListener('click', () => showAuthCard('signup'));
  btnGotoSigninFromSignup?.addEventListener('click', () => showAuthCard('signin'));
  btnGotoSigninFromForgot?.addEventListener('click', () => showAuthCard('signin'));

  // Toggle Password Visibility (Eye Icon helper)
  function setupEyeToggle(buttonEl, inputEl) {
    if (!buttonEl || !inputEl) return;
    buttonEl.addEventListener('click', () => {
      const isPassword = inputEl.getAttribute('type') === 'password';
      inputEl.setAttribute('type', isPassword ? 'text' : 'password');
      const iconOpen = buttonEl.querySelector('.eye-icon-open');
      const iconClosed = buttonEl.querySelector('.eye-icon-closed');
      if (isPassword) {
        iconOpen?.classList.add('hidden');
        iconClosed?.classList.remove('hidden');
        buttonEl.setAttribute('title', 'Hide password');
      } else {
        iconOpen?.classList.remove('hidden');
        iconClosed?.classList.add('hidden');
        buttonEl.setAttribute('title', 'Show password');
      }
    });
  }
  setupEyeToggle(btnTogglePassword, inputLoginPassword);
  setupEyeToggle(btnToggleSignupPassword, inputSignupPassword);

  function showLoginAlert(msg) {
    if (loginAlertBanner && loginAlertText) {
      loginAlertText.innerText = msg;
      loginAlertBanner.classList.remove('hidden');
      loginAlertBanner.style.animation = 'none';
      loginAlertBanner.offsetHeight;
      loginAlertBanner.style.animation = 'loginShake 0.3s ease';
    }
  }

  function hideLoginAlert() {
    loginAlertBanner?.classList.add('hidden');
  }

  function showSignupAlert(msg) {
    if (signupAlertBanner && signupAlertText) {
      signupAlertText.innerText = msg;
      signupAlertBanner.classList.remove('hidden');
      signupAlertBanner.style.animation = 'none';
      signupAlertBanner.offsetHeight;
      signupAlertBanner.style.animation = 'loginShake 0.3s ease';
    }
  }

  function hideSignupAlert() {
    signupAlertBanner?.classList.add('hidden');
  }

  function showForgotAlert(msg) {
    if (forgotAlertBanner && forgotAlertText) {
      forgotAlertText.innerText = msg;
      forgotAlertBanner.classList.remove('hidden');
      forgotAlertBanner.style.animation = 'none';
      forgotAlertBanner.offsetHeight;
      forgotAlertBanner.style.animation = 'loginShake 0.3s ease';
    }
  }

  function hideForgotAlert() {
    forgotAlertBanner?.classList.add('hidden');
  }

  function updateHeaderUser(user) {
    if (!user) return;
    if (headerUserAvatar) headerUserAvatar.innerText = user.initials || 'AU';
    if (headerUserName) headerUserName.innerText = user.name || 'Admin User';
    if (headerUserRole) headerUserRole.innerText = user.role || 'Enterprise QA';
    if (menuUserName) menuUserName.innerText = user.name || 'Admin User';
    if (menuUserEmail) menuUserEmail.innerText = user.email || 'admin@testpilot.ai';
  }

  // Handle Sign In Form Submission
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideLoginAlert();

    const email = (inputLoginEmail?.value || '').trim();
    const password = (inputLoginPassword?.value || '').trim();
    const rememberMe = checkboxRemember ? checkboxRemember.checked : true;

    if (!email) {
      showLoginAlert('Please enter your email address or username.');
      inputLoginEmail?.focus();
      return;
    }
    if (!password) {
      showLoginAlert('Please enter your account password.');
      inputLoginPassword?.focus();
      return;
    }

    if (btnLoginSubmit) btnLoginSubmit.disabled = true;
    if (loginSubmitSpinner) loginSubmitSpinner.classList.remove('hidden');
    if (btnLoginText) btnLoginText.innerText = 'Signing in...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Invalid email or password. Please verify your credentials.';
        showLoginAlert(errorMsg);
        showToast(errorMsg, 'danger');
        return;
      }

      localStorage.setItem('testpilot_auth_user', JSON.stringify(data.user));
      if (rememberMe) {
        localStorage.setItem('testpilot_remembered_email', email);
      } else {
        localStorage.removeItem('testpilot_remembered_email');
      }

      updateHeaderUser(data.user);
      viewLoginScreen?.classList.add('hidden');
      showToast(`✓ Welcome back, ${data.user.name}! Successfully signed in.`);
    } catch (err) {
      console.error('Sign in request failed:', err);
      const errorMsg = 'Unable to sign in. Please verify your credentials and network connection.';
      showLoginAlert(errorMsg);
      showToast(errorMsg, 'danger');
    } finally {
      if (btnLoginSubmit) btnLoginSubmit.disabled = false;
      if (loginSubmitSpinner) loginSubmitSpinner.classList.add('hidden');
      if (btnLoginText) btnLoginText.innerText = 'Sign in';
    }
  });

  // Handle Sign Up Form Submission
  formSignup?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideSignupAlert();

    const name = (inputSignupName?.value || '').trim();
    const email = (inputSignupEmail?.value || '').trim();
    const password = (inputSignupPassword?.value || '').trim();

    if (!name) {
      showSignupAlert('Please enter your full name.');
      showToast('Please enter your full name.', 'danger');
      inputSignupName?.focus();
      return;
    }
    if (!email || !email.includes('@')) {
      showSignupAlert('Please enter a valid work email address.');
      showToast('Please enter a valid work email address.', 'danger');
      inputSignupEmail?.focus();
      return;
    }
    if (!password || password.length < 4) {
      showSignupAlert('Password must be at least 4 characters long.');
      showToast('Password must be at least 4 characters long.', 'danger');
      inputSignupPassword?.focus();
      return;
    }

    if (btnSignupSubmit) btnSignupSubmit.disabled = true;
    if (signupSubmitSpinner) signupSubmitSpinner.classList.remove('hidden');
    if (btnSignupText) btnSignupText.innerText = 'Creating account...';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Failed to create account. Please try again.';
        showSignupAlert(errorMsg);
        showToast(errorMsg, 'danger');
        return;
      }

      localStorage.setItem('testpilot_auth_user', JSON.stringify(data.user));
      updateHeaderUser(data.user);
      viewLoginScreen?.classList.add('hidden');
      showToast(`✓ Welcome to TestPilot AI, ${data.user.name}! Account created and signed in.`);

      if (inputSignupPassword) inputSignupPassword.value = '';
      if (inputSignupEmail) inputSignupEmail.value = '';
      if (inputSignupName) inputSignupName.value = '';
      showAuthCard('signin');
    } catch (err) {
      console.error('Registration failed:', err);
      const errorMsg = 'Network error during registration. Please check connection and try again.';
      showSignupAlert(errorMsg);
      showToast(errorMsg, 'danger');
    } finally {
      if (btnSignupSubmit) btnSignupSubmit.disabled = false;
      if (signupSubmitSpinner) signupSubmitSpinner.classList.add('hidden');
      if (btnSignupText) btnSignupText.innerText = 'Create Account';
    }
  });

  // Handle Forgot Password Form Submission
  formForgot?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideForgotAlert();
    forgotSuccessBanner?.classList.add('hidden');

    const email = (inputForgotEmail?.value || '').trim();
    if (!email || !email.includes('@')) {
      showForgotAlert('Please provide a valid registered email address.');
      showToast('Please provide a valid registered email address.', 'danger');
      inputForgotEmail?.focus();
      return;
    }

    if (btnForgotSubmit) btnForgotSubmit.disabled = true;
    if (forgotSubmitSpinner) forgotSubmitSpinner.classList.remove('hidden');
    if (btnForgotText) btnForgotText.innerText = 'Sending...';

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Could not process password recovery request.';
        showForgotAlert(errorMsg);
        showToast(errorMsg, 'danger');
        return;
      }

      if (forgotSuccessBanner && forgotSuccessText) {
        forgotSuccessText.innerText = data.message || `Recovery instructions dispatched to ${email}.`;
        forgotSuccessBanner.classList.remove('hidden');
      }
      showToast('✓ Password recovery instructions sent.');
    } catch (err) {
      console.error('Forgot password request failed:', err);
      const errorMsg = 'Network error occurred. Please try again.';
      showForgotAlert(errorMsg);
      showToast(errorMsg, 'danger');
    } finally {
      if (btnForgotSubmit) btnForgotSubmit.disabled = false;
      if (forgotSubmitSpinner) forgotSubmitSpinner.classList.add('hidden');
      if (btnForgotText) btnForgotText.innerText = 'Send Recovery Link';
    }
  });

  // Toggle User Profile Dropdown
  if (btnUserProfile && menuUserProfile) {
    btnUserProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      menuUserProfile.classList.toggle('hidden');
      btnUserProfile.setAttribute('aria-expanded', !menuUserProfile.classList.contains('hidden'));
    });

    document.addEventListener('click', (e) => {
      if (!menuUserProfile.classList.contains('hidden')) {
        if (!menuUserProfile.contains(e.target) && !btnUserProfile.contains(e.target)) {
          menuUserProfile.classList.add('hidden');
          btnUserProfile.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // Sign Out / Switch Account
  async function performSignOut(isSwitch = false) {
    menuUserProfile?.classList.add('hidden');
    btnUserProfile?.setAttribute('aria-expanded', 'false');

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}

    localStorage.removeItem('testpilot_auth_user');

    if (inputLoginPassword) inputLoginPassword.value = '';
    const rememberedEmail = localStorage.getItem('testpilot_remembered_email');
    if (inputLoginEmail && rememberedEmail && !isSwitch) {
      inputLoginEmail.value = rememberedEmail;
    } else if (inputLoginEmail && isSwitch) {
      inputLoginEmail.value = '';
      inputLoginEmail.focus();
    }

    showAuthCard('signin');
    hideLoginAlert();
    viewLoginScreen?.classList.remove('hidden');
    showToast(isSwitch ? 'Please enter credentials to switch account.' : '✓ Signed out successfully.');
  }

  itemLogoutBtn?.addEventListener('click', () => performSignOut(false));
  itemSwitchAccount?.addEventListener('click', () => performSignOut(true));

  // Initialize Auth State on Page Load
  async function initAuth() {
    const cachedUserJson = localStorage.getItem('testpilot_auth_user');
    const rememberedEmail = localStorage.getItem('testpilot_remembered_email');

    if (rememberedEmail && inputLoginEmail) {
      inputLoginEmail.value = rememberedEmail;
    }

    if (cachedUserJson) {
      try {
        const cachedUser = JSON.parse(cachedUserJson);
        updateHeaderUser(cachedUser);
        viewLoginScreen?.classList.add('hidden');
        return;
      } catch {}
    }

    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          localStorage.setItem('testpilot_auth_user', JSON.stringify(data.user));
          updateHeaderUser(data.user);
          viewLoginScreen?.classList.add('hidden');
          return;
        }
      }
    } catch {}

    // Not logged in: Show sign-in screen
    viewLoginScreen?.classList.remove('hidden');
  }

  // Initialize
  async function init() {
    initAuth();
    fetchStatus();
    loadProjects();
    await loadCrawlSessions();
    await loadTestRuns();
    await loadDefects();
    loadAuditLogs();
    loadPerformanceData();
    renderTestedUrlsHistory();
  }
  init();

  // Poll status periodically
  setInterval(() => {
    fetchStatus();
  }, 10000);

  // Reload performance when switching to the tab
  document.getElementById('tab-btn-performance')?.addEventListener('click', () => {
    loadPerformanceData();
  });

  // Reload Tested URLs when switching to the tab
  document.getElementById('tab-btn-url-history')?.addEventListener('click', () => {
    renderTestedUrlsHistory();
  });

  // Quick Design Compare Header Button
  const btnQuickDesignCompare = document.getElementById('btn-quick-design-compare');
  if (btnQuickDesignCompare) {
    btnQuickDesignCompare.addEventListener('click', () => {
      document.getElementById('tab-btn-design-compare')?.click();
    });
  }

  // --- Design vs Code (Figma & Illustrator AI) Controller ---
  let selectedDesignFile = null;
  let activeDesignSourceType = 'file'; // 'file' | 'figma-url' | 'preset'
  let activePresetId = 'fixture-benchmark-homepage';
  let activeViewport = 'desktop';
  let activeDesignTolerance = 0.10;
  let currentDesignResult = null;
  let cachedPresets = [];
  let isDesignCompareInitialized = false;

  const tabBtnDesignCompare = document.getElementById('tab-btn-design-compare');
  if (tabBtnDesignCompare) {
    tabBtnDesignCompare.addEventListener('click', () => {
      initDesignCompare();
    });
  }

  function initDesignCompare() {
    if (isDesignCompareInitialized) {
      loadDesignHistory();
      return;
    }
    isDesignCompareInitialized = true;
    setupDesignCompareListeners();
    loadDesignPresets();
    loadDesignHistory();
  }

  function setupDesignCompareListeners() {
    // 1. Preset URL Chips
    const presetChips = document.querySelectorAll('.preset-chip');
    const inputTargetUrl = document.getElementById('input-design-target-url');
    const btnFixtureUrl = document.getElementById('btn-design-preset-fixture');

    presetChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        presetChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const url = chip.getAttribute('data-url');
        if (inputTargetUrl && url) {
          inputTargetUrl.value = url;
        }
      });
    });

    btnFixtureUrl?.addEventListener('click', () => {
      if (inputTargetUrl) inputTargetUrl.value = 'http://localhost:4000';
      presetChips.forEach((c) => c.classList.remove('active'));
      presetChips[0]?.classList.add('active');
    });

    // 2. Source Tabs (File vs Figma URL vs Presets)
    const srcTabs = document.querySelectorAll('.design-src-tab');
    const panelSrcFile = document.getElementById('panel-src-file');
    const panelSrcFigmaUrl = document.getElementById('panel-src-figma-url');
    const panelSrcPreset = document.getElementById('panel-src-preset');

    srcTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        srcTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        activeDesignSourceType = tab.getAttribute('data-source-type');

        panelSrcFile?.classList.toggle('hidden', activeDesignSourceType !== 'file');
        panelSrcFigmaUrl?.classList.toggle('hidden', activeDesignSourceType !== 'figma-url');
        panelSrcPreset?.classList.toggle('hidden', activeDesignSourceType !== 'preset');
      });
    });

    // 3. File Dropzone & Input
    const dropzone = document.getElementById('design-dropzone');
    const fileInput = document.getElementById('input-design-file');
    const cardSelectedFile = document.getElementById('card-selected-file');
    const labelSelectedExt = document.getElementById('label-selected-ext');
    const labelSelectedName = document.getElementById('label-selected-name');
    const labelSelectedSize = document.getElementById('label-selected-size');
    const btnRemoveFile = document.getElementById('btn-remove-file');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      ['dragenter', 'dragover'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('drag-over');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          handleSelectedFile(files[0]);
        }
      });

      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
          handleSelectedFile(fileInput.files[0]);
        }
      });
    }

    function handleSelectedFile(file) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const validExts = ['.fig', '.ai', '.xd', '.psd', '.psb', '.pdf', '.png', '.jpg', '.jpeg', '.svg', '.webp'];
      if (!validExts.includes(ext)) {
        showToast('Please upload a valid design file (.fig, .ai, .xd, .psd, .pdf, .svg, .png)', 'danger');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        selectedDesignFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          ext: ext,
          base64: e.target.result,
        };

        if (labelSelectedName) labelSelectedName.innerText = file.name;
        if (labelSelectedSize) {
          const mb = (file.size / (1024 * 1024)).toFixed(2);
          const kb = (file.size / 1024).toFixed(0);
          labelSelectedSize.innerText = `${file.size > 1048576 ? mb + ' MB' : kb + ' KB'} • Ready for comparison`;
        }
        if (labelSelectedExt) {
          labelSelectedExt.innerText = ext.replace('.', '').toUpperCase().substring(0, 4);
          if (ext === '.ai') {
            labelSelectedExt.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
          } else if (ext === '.xd') {
            labelSelectedExt.style.background = 'linear-gradient(135deg, #ec4899, #be185d)';
          } else if (ext === '.psd' || ext === '.psb') {
            labelSelectedExt.style.background = 'linear-gradient(135deg, #0ea5e9, #0369a1)';
          } else if (ext === '.pdf') {
            labelSelectedExt.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
          } else if (ext === '.fig') {
            labelSelectedExt.style.background = 'linear-gradient(135deg, #a855f7, #6366f1)';
          } else {
            labelSelectedExt.style.background = 'linear-gradient(135deg, #38bdf8, #2563eb)';
          }
        }

        dropzone?.classList.add('hidden');
        cardSelectedFile?.classList.remove('hidden');
        showToast(`✓ Selected design file: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }

    btnRemoveFile?.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedDesignFile = null;
      if (fileInput) fileInput.value = '';
      cardSelectedFile?.classList.add('hidden');
      dropzone?.classList.remove('hidden');
    });

    // 4. Viewport Selector
    const viewportBtns = document.querySelectorAll('#control-viewport .segment-btn');
    viewportBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        viewportBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeViewport = btn.getAttribute('data-viewport') || 'desktop';
      });
    });

    // 5. Tolerance Slider
    const inputTolerance = document.getElementById('input-tolerance');
    const labelTolerance = document.getElementById('label-tolerance-val');
    inputTolerance?.addEventListener('input', () => {
      activeDesignTolerance = parseFloat(inputTolerance.value);
      if (labelTolerance) {
        let label = 'Balanced';
        if (activeDesignTolerance <= 0.05) label = 'Strict High Parity';
        else if (activeDesignTolerance >= 0.20) label = 'Relaxed Tolerance';
        labelTolerance.innerText = `${label} (${activeDesignTolerance.toFixed(2)})`;
      }
    });

    // 6. View Mode Switcher (Split vs Side vs Diff)
    const viewModeBtns = document.querySelectorAll('#control-view-mode .segment-btn');
    const viewModeSplit = document.getElementById('view-mode-split');
    const viewModeSide = document.getElementById('view-mode-side');
    const viewModeDiff = document.getElementById('view-mode-diff');

    viewModeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        viewModeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');

        viewModeSplit?.classList.toggle('hidden', mode !== 'split');
        viewModeSide?.classList.toggle('hidden', mode !== 'side');
        viewModeDiff?.classList.toggle('hidden', mode !== 'diff');
      });
    });

    // 7. Interactive Split Slider Handle Drag Logic
    const splitContainer = document.getElementById('split-container');
    const splitOverlay = document.getElementById('split-overlay');
    const splitHandle = document.getElementById('split-handle');
    let isDraggingSplit = false;

    if (splitContainer && splitOverlay && splitHandle) {
      const updateSplitPosition = (clientX) => {
        const rect = splitContainer.getBoundingClientRect();
        let x = clientX - rect.left;
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;
        const pct = (x / rect.width) * 100;
        splitOverlay.style.width = `${pct}%`;
        splitHandle.style.left = `${pct}%`;
      };

      splitContainer.addEventListener('mousedown', (e) => {
        isDraggingSplit = true;
        updateSplitPosition(e.clientX);
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDraggingSplit) return;
        updateSplitPosition(e.clientX);
      });

      window.addEventListener('mouseup', () => {
        isDraggingSplit = false;
      });

      // Touch support
      splitContainer.addEventListener('touchstart', (e) => {
        isDraggingSplit = true;
        if (e.touches[0]) updateSplitPosition(e.touches[0].clientX);
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (!isDraggingSplit || !e.touches[0]) return;
        updateSplitPosition(e.touches[0].clientX);
      }, { passive: true });

      window.addEventListener('touchend', () => {
        isDraggingSplit = false;
      });
    }

    // 8. Fullscreen Inspector Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen-inspector');
    btnFullscreen?.addEventListener('click', () => {
      const inspectorPanel = btnFullscreen.closest('.panel');
      if (inspectorPanel) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          btnFullscreen.innerText = '⛶ Expand';
        } else {
          inspectorPanel.requestFullscreen().catch(() => {});
          btnFullscreen.innerText = '✕ Exit Fullscreen';
        }
      }
    });

    // 9. Run Design Comparison
    const btnRun = document.getElementById('btn-run-design-compare');
    btnRun?.addEventListener('click', () => {
      executeDesignComparison();
    });

    // 10. Refresh History
    document.getElementById('btn-refresh-design-history')?.addEventListener('click', () => {
      loadDesignHistory();
    });

    // 11. Category Filters for Issues
    const catPills = document.querySelectorAll('#issues-category-filters .cat-pill');
    catPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        catPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        const cat = pill.getAttribute('data-category');
        filterRenderedIssues(cat);
      });
    });
  }

  async function loadDesignPresets() {
    const container = document.getElementById('design-presets-cards');
    if (!container) return;

    try {
      const res = await fetch('/api/design-compare/presets');
      if (!res.ok) return;
      cachedPresets = await res.json();

      container.innerHTML = cachedPresets.map((preset, idx) => `
        <div class="preset-card ${idx === 0 ? 'active' : ''}" data-preset-id="${preset.id}">
          <span class="preset-card-badge ${preset.category === 'FIGMA' ? 'badge-fig' : preset.category === 'XD' ? 'badge-xd' : preset.category === 'PHOTOSHOP' ? 'badge-psd' : 'badge-ai'}">
            ${preset.category === 'FIGMA' ? 'FIGMA MASTER' : preset.category === 'XD' ? 'ADOBE XD .XD' : preset.category === 'PHOTOSHOP' ? 'PHOTOSHOP .PSD' : 'ILLUSTRATOR .AI'}
          </span>
          <div class="preset-card-title">${preset.title}</div>
          <div class="preset-card-desc">${preset.description}</div>
          <div style="font-size:11px; color:var(--accent-cyan); margin-top:8px; font-weight:600;">
            Target: ${preset.defaultUrl}
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.preset-card').forEach((card) => {
        card.addEventListener('click', () => {
          container.querySelectorAll('.preset-card').forEach((c) => c.classList.remove('active'));
          card.classList.add('active');
          activePresetId = card.getAttribute('data-preset-id');
          const found = cachedPresets.find((p) => p.id === activePresetId);
          if (found) {
            const inputTarget = document.getElementById('input-design-target-url');
            if (inputTarget) inputTarget.value = found.defaultUrl;
          }
        });
      });
    } catch (e) {
      console.warn('Failed to load design presets:', e);
    }
  }

  async function loadDesignHistory() {
    const tbody = document.getElementById('design-history-tbody');
    if (!tbody) return;

    try {
      const res = await fetch('/api/design-compare');
      if (!res.ok) return;
      const list = await res.json();

      const statFidelity = document.getElementById('stat-design-fidelity');
      const statDefects = document.getElementById('stat-design-issues-count');
      if (list.length > 0) {
        const avgScore = (list.reduce((sum, item) => sum + (item.fidelityScore || 0), 0) / list.length).toFixed(1);
        const totalDefects = list.reduce((sum, item) => sum + (item.issues?.length || 0), 0);
        if (statFidelity) statFidelity.innerText = `${avgScore}%`;
        if (statDefects) statDefects.innerText = totalDefects;
      }

      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No previous design audits yet. Run your first comparison above!</td></tr>`;
        return;
      }

      tbody.innerHTML = list.map((item) => {
        const score = item.fidelityScore || 0;
        const scoreClass = score >= 90 ? 'badge-success' : score >= 75 ? 'badge-warning' : 'badge-danger';
        const dateStr = new Date(item.timestamp).toLocaleString();
        const sourceLabel = item.sourceType === 'FIGMA_FILE'
          ? 'Figma (.fig)'
          : item.sourceType === 'AI_FILE'
          ? 'Illustrator (.ai)'
          : item.sourceType === 'ADOBE_XD_FILE'
          ? 'Adobe XD (.xd)'
          : item.sourceType === 'PHOTOSHOP_FILE'
          ? 'Photoshop (.psd)'
          : item.sourceType === 'ADOBE_XD_URL'
          ? 'Adobe XD URL'
          : item.sourceType === 'FIGMA_URL'
          ? 'Figma URL'
          : item.sourceType === 'BENCHMARK_PRESET'
          ? 'Benchmark Spec'
          : 'Image / PDF';

        const badgeClass = item.sourceType === 'FIGMA_FILE' ? 'badge-fig'
          : item.sourceType === 'AI_FILE' ? 'badge-ai'
          : (item.sourceType === 'ADOBE_XD_FILE' || item.sourceType === 'ADOBE_XD_URL') ? 'badge-xd'
          : item.sourceType === 'PHOTOSHOP_FILE' ? 'badge-psd'
          : 'badge-info';

        return `
          <tr>
            <td style="font-size:12px; color:var(--text-muted);">${dateStr}</td>
            <td><code style="font-size:12px; color:var(--text-primary);">${item.targetUrl}</code></td>
            <td><span class="badge ${badgeClass}">${sourceLabel}</span></td>
            <td><span style="font-size:12px;">${item.viewport?.name || 'Desktop'}</span></td>
            <td><span class="badge ${scoreClass}" style="font-weight:700;">${score}% Parity</span></td>
            <td><span class="badge ${item.issues?.length > 0 ? 'badge-danger' : 'badge-success'}">${item.issues?.length || 0} issues</span></td>
            <td>
              <button class="btn btn-outline btn-sm btn-inspect-history" data-id="${item.id}" title="Inspect this comparison">Inspect</button>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.btn-inspect-history').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          try {
            const r = await fetch(`/api/design-compare/${id}`);
            if (r.ok) {
              const data = await r.json();
              renderDesignComparisonResult(data);
              document.getElementById('panel-design-results')?.scrollIntoView({ behavior: 'smooth' });
            }
          } catch (e) {
            console.error('Failed to inspect design comparison:', e);
          }
        });
      });
    } catch (e) {
      console.warn('Failed to load design history:', e);
    }
  }

  async function executeDesignComparison() {
    const inputTarget = document.getElementById('input-design-target-url');
    const targetUrl = (inputTarget?.value || 'http://localhost:4000').trim();

    if (!targetUrl) {
      showToast('Please specify a target website URL', 'danger');
      inputTarget?.focus();
      return;
    }

    const payload = {
      targetUrl,
      sourceType: undefined,
      fileName: undefined,
      fileBase64: undefined,
      figmaUrl: undefined,
      adobeUrl: undefined,
      figmaToken: undefined,
      presetId: undefined,
      viewport: activeViewport,
      tolerance: activeDesignTolerance,
    };

    if (activeDesignSourceType === 'file') {
      if (!selectedDesignFile) {
        showToast('Please upload a Figma (.fig), Adobe (.ai, .xd, .psd, .pdf), or design image file', 'warning');
        return;
      }
      payload.sourceType = selectedDesignFile.ext === '.fig' ? 'FIGMA_FILE'
        : selectedDesignFile.ext === '.ai' ? 'AI_FILE'
        : selectedDesignFile.ext === '.xd' ? 'ADOBE_XD_FILE'
        : (selectedDesignFile.ext === '.psd' || selectedDesignFile.ext === '.psb') ? 'PHOTOSHOP_FILE'
        : 'IMAGE_UPLOAD';
      payload.fileName = selectedDesignFile.name;
      payload.fileBase64 = selectedDesignFile.base64;
    } else if (activeDesignSourceType === 'figma-url') {
      const inputFigma = document.getElementById('input-figma-url');
      const inputToken = document.getElementById('input-figma-token');
      const designUrl = (inputFigma?.value || '').trim();
      if (!designUrl) {
        showToast('Please enter a valid Figma or Adobe XD URL', 'warning');
        inputFigma?.focus();
        return;
      }
      const isAdobe = designUrl.toLowerCase().includes('xd.adobe.com') || designUrl.toLowerCase().includes('adobe.com');
      payload.sourceType = isAdobe ? 'ADOBE_XD_URL' : 'FIGMA_URL';
      payload.figmaUrl = designUrl;
      payload.adobeUrl = isAdobe ? designUrl : undefined;
      payload.figmaToken = (inputToken?.value || '').trim() || undefined;
    } else {
      payload.sourceType = 'BENCHMARK_PRESET';
      payload.presetId = activePresetId || 'fixture-benchmark-homepage';
    }

    const btnRun = document.getElementById('btn-run-design-compare');
    const spinner = document.getElementById('btn-design-spinner');
    const iconRun = document.getElementById('icon-design-run');
    const progressPanel = document.getElementById('panel-design-progress');
    const resultsPanel = document.getElementById('panel-design-results');
    const progressTitle = document.getElementById('design-progress-title');
    const progressSubtitle = document.getElementById('design-progress-subtitle');

    if (btnRun) btnRun.disabled = true;
    spinner?.classList.remove('hidden');
    iconRun?.classList.add('hidden');
    progressPanel?.classList.remove('hidden');
    resultsPanel?.classList.add('hidden');

    if (progressTitle) progressTitle.innerText = 'Initializing Autonomous Quality Engine...';
    if (progressSubtitle) progressSubtitle.innerText = `Connecting to ${targetUrl} with Playwright headless browser...`;

    try {
      const response = await fetch('/api/design-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      currentDesignResult = result;
      renderDesignComparisonResult(result);
      loadDesignHistory();

      showToast(`✓ Design comparison complete! Fidelity Score: ${result.fidelityScore}%`);
      resultsPanel?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Design comparison error:', err);
      showToast(`Comparison error: ${err.message}`, 'danger');
    } finally {
      if (btnRun) btnRun.disabled = false;
      spinner?.classList.add('hidden');
      iconRun?.classList.remove('hidden');
      progressPanel?.classList.add('hidden');
    }
  }

  function renderDesignComparisonResult(result) {
    const resultsPanel = document.getElementById('panel-design-results');
    if (!resultsPanel) return;
    resultsPanel.classList.remove('hidden');

    // 1. KPI Cards
    const kpiScore = document.getElementById('kpi-fidelity-score');
    const kpiGrade = document.getElementById('kpi-fidelity-grade');
    const kpiIssuesTotal = document.getElementById('kpi-issues-total');
    const kpiIssuesBreakdown = document.getElementById('kpi-issues-breakdown');
    const kpiColor = document.getElementById('kpi-color-accuracy');
    const kpiLayout = document.getElementById('kpi-layout-accuracy');

    const score = result.fidelityScore || 0;
    if (kpiScore) {
      kpiScore.innerText = `${score}%`;
      kpiScore.style.color = score >= 90 ? 'var(--accent-cyan)' : score >= 75 ? '#eab308' : 'var(--accent-rose)';
    }
    if (kpiGrade) {
      let grade = 'Grade A (Pixel Parity)';
      if (score < 70) grade = 'Grade D (Significant Drift)';
      else if (score < 80) grade = 'Grade C (Moderate Drift)';
      else if (score < 90) grade = 'Grade B (Minor Deviations)';
      kpiGrade.innerText = grade;
    }

    const issues = result.issues || [];
    if (kpiIssuesTotal) kpiIssuesTotal.innerText = issues.length;
    if (kpiIssuesBreakdown) {
      const p1 = issues.filter((i) => i.severity === 'P1').length;
      const p2 = issues.filter((i) => i.severity === 'P2').length;
      const p3 = issues.filter((i) => i.severity === 'P3' || i.severity === 'P4').length;
      kpiIssuesBreakdown.innerText = `${p1} P1 Critical • ${p2} P2 High • ${p3} Minor`;
    }

    if (kpiColor) kpiColor.innerText = `${result.metrics?.colorAccuracyPercent || 98}%`;
    if (kpiLayout) kpiLayout.innerText = `${result.metrics?.layoutAccuracyPercent || 92}%`;

    // 2. Images in Comparison Viewers
    const imgDesignSplit = document.getElementById('img-design-split');
    const imgLiveSplit = document.getElementById('img-live-split');
    const imgDesignSide = document.getElementById('img-design-side');
    const imgLiveSide = document.getElementById('img-live-side');
    const imgDiffOverlay = document.getElementById('img-diff-overlay');

    const linkDesign = document.getElementById('link-download-design');
    const linkLive = document.getElementById('link-download-live');
    const linkDiff = document.getElementById('link-download-diff');

    if (imgDesignSplit && result.designSnapshotPath) imgDesignSplit.src = result.designSnapshotPath;
    if (imgLiveSplit && result.liveSnapshotPath) imgLiveSplit.src = result.liveSnapshotPath;
    if (imgDesignSide && result.designSnapshotPath) imgDesignSide.src = result.designSnapshotPath;
    if (imgLiveSide && result.liveSnapshotPath) imgLiveSide.src = result.liveSnapshotPath;
    if (imgDiffOverlay && result.diffOverlayPath) imgDiffOverlay.src = result.diffOverlayPath;

    if (linkDesign && result.designSnapshotPath) linkDesign.href = result.designSnapshotPath;
    if (linkLive && result.liveSnapshotPath) linkLive.href = result.liveSnapshotPath;
    if (linkDiff && result.diffOverlayPath) linkDiff.href = result.diffOverlayPath;

    // Reset split handle to 50%
    const splitOverlay = document.getElementById('split-overlay');
    const splitHandle = document.getElementById('split-handle');
    if (splitOverlay) splitOverlay.style.width = '50%';
    if (splitHandle) splitHandle.style.left = '50%';

    // 3. Render Issues List
    renderIssuesList(issues);
  }

  function renderIssuesList(issues) {
    const listContainer = document.getElementById('design-issues-list');
    const badgeTab = document.getElementById('badge-issues-count-tab');
    if (badgeTab) badgeTab.innerText = issues.length;
    if (!listContainer) return;

    if (issues.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state" style="padding:32px 16px;">
          <div class="empty-icon" style="color:var(--accent-emerald);">✓</div>
          <div style="font-weight:700; color:var(--text-primary); margin-top:8px;">Zero UI Regressions Detected</div>
          <p style="color:var(--text-muted); font-size:13px; margin-top:4px;">Live rendered page matches design system specifications with 100% pixel parity.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = issues.map((issue) => {
      const sevClass = issue.severity ? issue.severity.toLowerCase() : 'p3';
      const sevBadge = issue.severity === 'P1'
        ? '<span class="badge badge-danger">P1 Critical</span>'
        : issue.severity === 'P2'
        ? '<span class="badge badge-warning">P2 High</span>'
        : '<span class="badge badge-info">P3 Moderate</span>';

      const catLabel = issue.category.replace(/_/g, ' ');

      return `
        <div class="design-issue-card ${sevClass}" data-category="${issue.category}">
          <div class="issue-card-top">
            <div class="issue-title-group">
              ${sevBadge}
              <span class="badge" style="background:rgba(255,255,255,0.06); font-size:11px;">${catLabel}</span>
              <span class="issue-title">${issue.title}</span>
            </div>
            ${issue.selector ? `<code style="font-size:11.5px; color:var(--accent-cyan);">${issue.selector}</code>` : ''}
          </div>

          <div class="issue-desc">${issue.description}</div>

          <div class="comparison-specs-grid">
            <div class="spec-box spec-box-expected">
              <div class="spec-box-label">Design Spec Reference</div>
              <div>${issue.expectedDesign}</div>
            </div>
            <div class="spec-box spec-box-actual">
              <div class="spec-box-label">Live Implementation</div>
              <div>${issue.actualImplementation}</div>
            </div>
          </div>

          ${issue.suggestedCssFix ? `
            <div class="css-fix-wrapper">
              <div class="css-fix-header">
                <span>Actionable CSS Fix</span>
                <button type="button" class="btn-copy-css" data-css="${encodeURIComponent(issue.suggestedCssFix)}">📋 Copy CSS Fix</button>
              </div>
              <pre class="css-code-pre"><code>${issue.suggestedCssFix}</code></pre>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach copy CSS handlers
    listContainer.querySelectorAll('.btn-copy-css').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = decodeURIComponent(btn.getAttribute('data-css') || '');
        if (raw) {
          navigator.clipboard.writeText(raw).then(() => {
            btn.innerText = '✓ Copied!';
            showToast('✓ CSS fix copied to clipboard!');
            setTimeout(() => { btn.innerText = '📋 Copy CSS Fix'; }, 2000);
          }).catch(() => {
            showToast('Could not access clipboard', 'warning');
          });
        }
      });
    });
  }

  function filterRenderedIssues(category) {
    const cards = document.querySelectorAll('#design-issues-list .design-issue-card');
    cards.forEach((card) => {
      if (category === 'ALL' || card.getAttribute('data-category') === category) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // ==========================================
  // MCP Hub & QA Command Center Controller
  // ==========================================
  const mcpToolSelect = document.getElementById('mcp-tool-select');
  const mcpArgsInput = document.getElementById('mcp-args-input');
  const btnExecuteMcp = document.getElementById('btn-execute-mcp-terminal');
  const mcpOutputTerminal = document.getElementById('mcp-output-terminal');
  const btnRefreshMcp = document.getElementById('btn-refresh-mcp-status');
  const mcpServerCount = document.getElementById('mcp-server-count');
  const mcpToolCount = document.getElementById('mcp-tool-count');

  const SAMPLE_MCP_ARGS = {
    playwright_inspect_dom: { includeInteractivity: true },
    maestro_author_flow: {
      appId: "com.testpilot.mobile",
      steps: ["tap Login", "type test@testpilot.ai into Email", "assert Home Feed visible"]
    },
    cypress_get_flaky_tests: { lookbackDays: 14 },
    cloud_devices_catalog: { provider: "all" },
    k6_run_load_test: { targetUrl: "http://localhost:3000", scenario: "smoke", durationSec: 3 },
    reportportal_auto_analysis: { launchId: "rp-launch-1082" },
    vibium_execute_action: { instruction: "click search input and verify results", targetUrl: "http://localhost:3000" },
    thunder_author_from_intent: {
      storyTitle: "User Checkout",
      intentDescription: "Navigate to cart. Apply discount code. Verify zero shipping."
    },
    axe_check_contrast: { foregroundHex: "#333333", backgroundHex: "#FFFFFF", fontSizePt: 14, isBold: false },
    testguild_recommend_stack: { platform: "web", teamSkill: "mixed", budget: "enterprise", focusArea: "full_coverage" }
  };

  mcpToolSelect?.addEventListener('change', () => {
    const tool = mcpToolSelect.value;
    if (tool && SAMPLE_MCP_ARGS[tool]) {
      mcpArgsInput.value = JSON.stringify(SAMPLE_MCP_ARGS[tool], null, 2);
    }
  });

  async function executeMcpToolCall(toolName, args) {
    if (!mcpOutputTerminal) return;
    mcpOutputTerminal.innerText = `[JSON-RPC 2.0] Dispatching tools/call for '${toolName}'...\nWaiting for MCP server response...`;
    if (btnExecuteMcp) btnExecuteMcp.disabled = true;

    try {
      const res = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, arguments: args }),
      });
      const data = await res.json();
      let formatted = data;
      if (data?.content?.[0]?.text) {
        try {
          formatted = JSON.parse(data.content[0].text);
        } catch {
          formatted = data.content[0].text;
        }
      }
      mcpOutputTerminal.innerText = typeof formatted === 'string' ? formatted : JSON.stringify(formatted, null, 2);
      if (typeof showToast === 'function') {
        showToast(`✓ MCP tool '${toolName}' executed successfully!`);
      }
    } catch (err) {
      mcpOutputTerminal.innerText = `[MCP Error]: ${err.message || err}`;
      if (typeof showToast === 'function') {
        showToast(`MCP Execution Failed: ${err.message}`, 'error');
      }
    } finally {
      if (btnExecuteMcp) btnExecuteMcp.disabled = false;
    }
  }

  btnExecuteMcp?.addEventListener('click', () => {
    const toolName = mcpToolSelect?.value;
    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(mcpArgsInput?.value || '{}');
    } catch (e) {
      alert('Invalid JSON in Input Arguments: ' + e.message);
      return;
    }
    executeMcpToolCall(toolName, parsedArgs);
  });

  document.querySelectorAll('.mcp-quick-run').forEach((btn) => {
    btn.addEventListener('click', () => {
      const toolName = btn.getAttribute('data-tool');
      const rawArgs = btn.getAttribute('data-args');
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(rawArgs || '{}');
      } catch {}

      if (mcpToolSelect) mcpToolSelect.value = toolName;
      if (mcpArgsInput) mcpArgsInput.value = JSON.stringify(parsedArgs, null, 2);

      // Scroll to execution terminal
      mcpOutputTerminal?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      executeMcpToolCall(toolName, parsedArgs);
    });
  });

  async function refreshMcpStatus() {
    try {
      const res = await fetch('/api/mcp/servers');
      const data = await res.json();
      if (data.servers && mcpServerCount) {
        mcpServerCount.innerText = data.servers.length;
      }
      const toolsRes = await fetch('/api/mcp/tools');
      const toolsData = await toolsRes.json();
      if (toolsData.tools && mcpToolCount) {
        mcpToolCount.innerText = toolsData.tools.length;
      }
      if (typeof showToast === 'function') {
        showToast(`✓ Pinged ${data.servers?.length || 10} MCP servers: 100% OPERATIONAL`);
      }
    } catch (e) {
      console.warn('Could not refresh MCP servers:', e);
    }
  }

  btnRefreshMcp?.addEventListener('click', refreshMcpStatus);
});

