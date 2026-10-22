// TestPilot AI - Enterprise Spreadsheet & CSV Exporter Engine
// Properly aligns all tested data (metrics, runs, defects, CWV, crawl pages) according to tested URLs.

(function (window) {
  'use strict';

  function xmlEscape(val) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function csvEscape(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Escape double quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  }

  function formatDate(isoStr) {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return String(isoStr);
      return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
    } catch {
      return String(isoStr);
    }
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }

  function getTimestampSuffix() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  /**
   * Compiles and cleans all tested data, associating and aligning metrics with each tested URL.
   */
  function compileDataset(items, allDefects, allRuns, allCrawlSessions) {
    const compiledUrls = [];
    const allDefectsAligned = [];
    const allPerfAligned = [];
    const allEndpointsAligned = [];

    (items || []).forEach((item) => {
      let pathname = '/';
      let hostname = '';
      try {
        const parsed = new URL(item.url);
        pathname = parsed.pathname || '/';
        hostname = parsed.hostname;
      } catch {
        pathname = item.url;
      }

      const crawledPage = item.crawledPages && item.crawledPages.length > 0 ? item.crawledPages[0] : null;
      const title = crawledPage?.title || (item.isPrimary ? `${hostname} (Root Target)` : pathname);
      const statusCode = crawledPage?.statusCode || (item.runs.length > 0 ? 200 : '—');

      const p1Defects = item.defects.filter((d) => d.severity === 'P1');
      const p2Defects = item.defects.filter((d) => d.severity === 'P2');
      const p3Defects = item.defects.filter((d) => d.severity === 'P3');
      const p4Defects = item.defects.filter((d) => d.severity === 'P4');

      const a11yDefects = item.defects.filter((d) => d.category === 'ACCESSIBILITY');
      const secDefects = item.defects.filter((d) => d.category === 'SECURITY');
      const funcDefects = item.defects.filter((d) => d.category === 'FUNCTIONAL');
      const perfDefects = item.defects.filter((d) => d.category === 'PERFORMANCE');

      let healthVerdict = 'ALL_PASSED';
      if (p1Defects.length > 0) {
        healthVerdict = `CRITICAL (${p1Defects.length} P1)`;
      } else if (p2Defects.length > 0) {
        healthVerdict = `HIGH_DEFECTS (${p2Defects.length} P2)`;
      } else if (item.defects.length > 0) {
        healthVerdict = `DEFECTIVE (${item.defects.length} Issues)`;
      }

      const totalRuns = item.runs.length;
      const completedRuns = item.runs.filter((r) => r.status === 'COMPLETED').length;
      const passRatePct = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 100;

      const avgSpeed = item.perfMetrics && item.perfMetrics.length > 0
        ? Math.round(item.perfMetrics.reduce((s, m) => s + (m.navigationDurationMs || 0), 0) / item.perfMetrics.length)
        : (crawledPage?.loadTimeMs || 0);

      const defectSummaries = item.defects
        .map((d) => `[${d.severity}] ${d.title}`)
        .join('; ');

      const row = {
        url: item.url,
        path: pathname,
        domain: hostname,
        title: title,
        type: item.isPrimary ? 'PRIMARY_TARGET' : 'DISCOVERED_PAGE',
        statusCode: statusCode,
        health: healthVerdict,
        runsCount: totalRuns,
        passRatePct: passRatePct,
        defectsTotal: item.defects.length,
        p1Count: p1Defects.length,
        p2Count: p2Defects.length,
        p3Count: p3Defects.length,
        p4Count: p4Defects.length,
        a11yCount: a11yDefects.length,
        secCount: secDefects.length,
        funcCount: funcDefects.length,
        perfCount: perfDefects.length,
        avgLatencyMs: avgSpeed,
        interactiveCount: crawledPage?.interactiveElements?.length || 0,
        hasForms: crawledPage?.hasForms ? 'Yes' : 'No',
        firstTested: item.firstTested,
        lastTested: item.lastTested,
        defectSummaries: defectSummaries || 'None',
        defects: item.defects,
        crawledPages: item.crawledPages || [],
        perfMetrics: item.perfMetrics || [],
      };

      compiledUrls.push(row);

      // Collect defects aligned with this tested URL
      item.defects.forEach((d) => {
        allDefectsAligned.push({
          testedUrl: item.url,
          endpoint: pathname,
          pageTitle: title,
          defectId: d.id,
          severity: d.severity,
          category: d.category,
          status: d.status || 'OPEN',
          title: d.title,
          summary: d.summary || d.description || '',
          rootCause: d.rootCauseAnalysis || d.likelyCauseExplanation || '',
          reproduction: Array.isArray(d.reproductionSteps) ? d.reproductionSteps.join(' -> ') : (d.reproductionSteps || ''),
          suggestedFix: d.suggestedFix || '',
          testRunId: d.testRunId || '',
          firstSeen: d.firstSeenAt || item.firstTested,
        });
      });

      // Collect performance records aligned with this tested URL
      (item.perfMetrics || []).forEach((m) => {
        allPerfAligned.push({
          testedUrl: item.url,
          endpoint: pathname,
          navigationMs: m.navigationDurationMs || 0,
          ttfbMs: m.ttfbMs || 0,
          fcpMs: m.firstContentfulPaintMs || 0,
          lcpMs: m.largestContentfulPaintMs || 0,
          cls: m.cumulativeLayoutShift !== undefined ? m.cumulativeLayoutShift : 0,
          requestsCount: m.totalRequests || 0,
          issuesCount: (m.issues || []).length,
          runId: item.runs[0]?.id || 'latest',
        });
      });

      // Collect crawl endpoints aligned with this tested URL
      (item.crawledPages || []).forEach((p) => {
        allEndpointsAligned.push({
          parentUrl: item.url,
          pageUrl: p.url,
          endpoint: p.url ? p.url.replace(/^https?:\/\/[^/]+/, '') || '/' : '/',
          title: p.title || 'Untitled',
          statusCode: p.statusCode || 200,
          depth: p.depth || 0,
          interactiveCount: p.interactiveElements?.length || 0,
          hasForms: p.hasForms ? 'Yes' : 'No',
          loadTimeMs: p.loadTimeMs || 0,
        });
      });
    });

    return {
      urls: compiledUrls,
      defects: allDefectsAligned,
      performance: allPerfAligned,
      endpoints: allEndpointsAligned,
    };
  }

  /**
   * Generates a modern native Microsoft Excel OpenXML (.xlsx) multi-sheet binary workbook
   * using ExcelJS with rich styling, frozen header rows, color-coded health badges, and auto-filters.
   */
  async function generateExcelXlsx(dataset) {
    const { urls, defects, performance, endpoints } = dataset;
    const ExcelJS = window.ExcelJS;
    if (!ExcelJS) {
      throw new Error('ExcelJS library is not loaded');
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'TestPilot AI Platform';
    wb.lastModifiedBy = 'TestPilot AI Platform';
    wb.created = new Date();
    wb.modified = new Date();

    const applyHeaderStyle = (ws) => {
      ws.getRow(1).height = 28;
      ws.getRow(1).eachCell((cell) => {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF334155' } },
          bottom: { style: 'medium', color: { argb: 'FF0284C7' } },
          left: { style: 'thin', color: { argb: 'FF334155' } },
          right: { style: 'thin', color: { argb: 'FF334155' } },
        };
      });
    };

    // Sheet 1: Tested URLs Summary
    const wsUrls = wb.addWorksheet('Tested URLs Summary', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });
    wsUrls.columns = [
      { header: 'Tested URL', key: 'url', width: 45 },
      { header: 'Path / Route', key: 'path', width: 28 },
      { header: 'Domain', key: 'domain', width: 22 },
      { header: 'Page Title', key: 'title', width: 32 },
      { header: 'Target Type', key: 'type', width: 18 },
      { header: 'HTTP Status', key: 'statusCode', width: 13 },
      { header: 'Overall Health', key: 'health', width: 22 },
      { header: 'Test Runs', key: 'runsCount', width: 12 },
      { header: 'Pass Rate %', key: 'passRatePct', width: 14 },
      { header: 'Total Defects', key: 'defectsTotal', width: 14 },
      { header: 'P1 Critical', key: 'p1Count', width: 12 },
      { header: 'P2 High', key: 'p2Count', width: 12 },
      { header: 'P3 Medium', key: 'p3Count', width: 12 },
      { header: 'P4 Low', key: 'p4Count', width: 12 },
      { header: 'Accessibility Issues', key: 'a11yCount', width: 20 },
      { header: 'Security Issues', key: 'secCount', width: 16 },
      { header: 'Functional Issues', key: 'funcCount', width: 18 },
      { header: 'Performance Issues', key: 'perfCount', width: 18 },
      { header: 'Avg Latency (ms)', key: 'avgLatencyMs', width: 16 },
      { header: 'Interactive Elements', key: 'interactiveCount', width: 20 },
      { header: 'Forms Present', key: 'hasForms', width: 14 },
      { header: 'First Tested At', key: 'firstTested', width: 22 },
      { header: 'Last Tested At', key: 'lastTested', width: 22 },
      { header: 'Defects Breakdown', key: 'defectSummaries', width: 45 },
    ];
    applyHeaderStyle(wsUrls);

    urls.forEach((u) => {
      const row = wsUrls.addRow({
        url: u.url,
        path: u.path,
        domain: u.domain,
        title: u.title,
        type: u.type,
        statusCode: u.statusCode,
        health: u.health,
        runsCount: u.runsCount,
        passRatePct: `${u.passRatePct}%`,
        defectsTotal: u.defectsTotal,
        p1Count: u.p1Count,
        p2Count: u.p2Count,
        p3Count: u.p3Count,
        p4Count: u.p4Count,
        a11yCount: u.a11yCount || 0,
        secCount: u.secCount,
        funcCount: u.funcCount,
        perfCount: u.perfCount,
        avgLatencyMs: u.avgLatencyMs,
        interactiveCount: u.interactiveCount,
        hasForms: u.hasForms,
        firstTested: formatDate(u.firstTested),
        lastTested: formatDate(u.lastTested),
        defectSummaries: u.defectSummaries,
      });

      row.height = 20;

      const cellUrl = row.getCell('url');
      cellUrl.font = { name: 'Consolas', size: 9.5, color: { argb: 'FF0284C7' }, bold: true };

      const cellHealth = row.getCell('health');
      if (u.p1Count > 0) {
        cellHealth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cellHealth.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF991B1B' } };
      } else if (u.p2Count > 0) {
        cellHealth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
        cellHealth.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF9A3412' } };
      } else if (u.defectsTotal > 0) {
        cellHealth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
        cellHealth.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF854D0E' } };
      } else {
        cellHealth.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        cellHealth.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };
      }
    });
    wsUrls.autoFilter = { from: 'A1', to: 'X1' };

    // Sheet 2: Defects Aligned By URL
    const wsDefects = wb.addWorksheet('Defects Aligned By URL', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });
    wsDefects.columns = [
      { header: 'Tested URL', key: 'testedUrl', width: 45 },
      { header: 'Page Route', key: 'endpoint', width: 25 },
      { header: 'Page Title', key: 'pageTitle', width: 30 },
      { header: 'Defect ID', key: 'defectId', width: 20 },
      { header: 'Severity', key: 'severity', width: 12 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Defect Title', key: 'title', width: 35 },
      { header: 'Summary', key: 'summary', width: 45 },
      { header: 'Root Cause Analysis', key: 'rootCause', width: 50 },
      { header: 'Reproduction Steps', key: 'reproduction', width: 45 },
      { header: 'Suggested Remediation Fix', key: 'suggestedFix', width: 50 },
      { header: 'Test Run ID', key: 'testRunId', width: 24 },
      { header: 'First Detected Timestamp', key: 'firstSeen', width: 22 },
    ];
    applyHeaderStyle(wsDefects);

    defects.forEach((d) => {
      const row = wsDefects.addRow({
        testedUrl: d.testedUrl,
        endpoint: d.endpoint,
        pageTitle: d.pageTitle,
        defectId: d.defectId,
        severity: d.severity,
        category: d.category,
        status: d.status,
        title: d.title,
        summary: d.summary,
        rootCause: d.rootCause,
        reproduction: d.reproduction,
        suggestedFix: d.suggestedFix,
        testRunId: d.testRunId,
        firstSeen: formatDate(d.firstSeen),
      });

      row.height = 20;

      const cellSev = row.getCell('severity');
      if (d.severity === 'P1') {
        cellSev.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cellSev.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF991B1B' } };
      } else if (d.severity === 'P2') {
        cellSev.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
        cellSev.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF9A3412' } };
      } else if (d.severity === 'P3') {
        cellSev.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
        cellSev.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF854D0E' } };
      }
    });
    wsDefects.autoFilter = { from: 'A1', to: 'N1' };

    // Sheet 3: Performance & CWV
    const wsPerf = wb.addWorksheet('Performance CWV', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });
    wsPerf.columns = [
      { header: 'Tested URL', key: 'testedUrl', width: 45 },
      { header: 'Endpoint', key: 'endpoint', width: 25 },
      { header: 'Navigation Duration (ms)', key: 'navigationMs', width: 24 },
      { header: 'Time to First Byte (ms)', key: 'ttfbMs', width: 22 },
      { header: 'First Contentful Paint (ms)', key: 'fcpMs', width: 24 },
      { header: 'Largest Contentful Paint (ms)', key: 'lcpMs', width: 26 },
      { header: 'Cumulative Layout Shift', key: 'cls', width: 24 },
      { header: 'Total Requests', key: 'requestsCount', width: 16 },
      { header: 'Issues Count', key: 'issuesCount', width: 16 },
      { header: 'Test Run ID', key: 'runId', width: 24 },
    ];
    applyHeaderStyle(wsPerf);

    performance.forEach((p) => {
      const row = wsPerf.addRow(p);
      row.height = 20;
    });
    wsPerf.autoFilter = { from: 'A1', to: 'J1' };

    // Sheet 4: Discovered Endpoints
    const wsEndpoints = wb.addWorksheet('Discovered Endpoints', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });
    wsEndpoints.columns = [
      { header: 'Parent Tested URL', key: 'parentUrl', width: 45 },
      { header: 'Page URL', key: 'pageUrl', width: 45 },
      { header: 'Endpoint', key: 'endpoint', width: 25 },
      { header: 'Page Title', key: 'title', width: 32 },
      { header: 'HTTP Status Code', key: 'statusCode', width: 16 },
      { header: 'Crawl Depth', key: 'depth', width: 14 },
      { header: 'Interactive Elements', key: 'interactiveCount', width: 20 },
      { header: 'Forms Present', key: 'hasForms', width: 14 },
      { header: 'Load Time (ms)', key: 'loadTimeMs', width: 16 },
    ];
    applyHeaderStyle(wsEndpoints);

    endpoints.forEach((e) => {
      const row = wsEndpoints.addRow(e);
      row.height = 20;
    });
    wsEndpoints.autoFilter = { from: 'A1', to: 'I1' };

    return await wb.xlsx.writeBuffer();
  }

  /**
   * Generates a multi-sheet Microsoft Excel SpreadsheetML XML (.xls) workbook (legacy fallback).
   */
  function generateExcelSpreadsheetXml(dataset) {
    const { urls, defects, performance, endpoints } = dataset;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>TestPilot AI - Tested URLs Data Report</Title>
  <Subject>Automated Web Testing Audit Report</Subject>
  <Author>TestPilot AI Platform</Author>
  <Created>${new Date().toISOString()}</Created>
  <Company>TestPilot AI</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- Main Header Banner -->
  <Style ss:ID="HeaderTitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="14" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <!-- Table Column Header -->
  <Style ss:ID="TableHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0284C7"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#F8FAFC" ss:Bold="1"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <!-- Cell Styles -->
  <Style ss:ID="CellUrl">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Consolas" x:Family="Modern" ss:Size="9.5" ss:Color="#0284C7" ss:Bold="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellPath">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Consolas" x:Family="Modern" ss:Size="9.5" ss:Color="#475569"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellText">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9.5" ss:Color="#1E293B"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9.5" ss:Color="#1E293B"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9.5" ss:Color="#1E293B"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellNumberP1">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9.5" ss:Color="#BE123C" ss:Bold="1"/>
   <Interior ss:Color="#FFE4E6" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECDD3"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECDD3"/>
   </Borders>
  </Style>
  <Style ss:ID="CellNumberP2">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9.5" ss:Color="#C2410C" ss:Bold="1"/>
   <Interior ss:Color="#FFEDD5" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FED7AA"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FED7AA"/>
   </Borders>
  </Style>
  <Style ss:ID="CellPercent">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9.5" ss:Color="#1E293B" ss:Bold="1"/>
   <NumberFormat ss:Format="0%"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellDate">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9" ss:Color="#64748B"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <!-- Badges -->
  <Style ss:ID="BadgeAllPassed">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9" ss:Color="#15803D" ss:Bold="1"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BBF7D0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BBF7D0"/>
   </Borders>
  </Style>
  <Style ss:ID="BadgeCritical">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9" ss:Color="#BE123C" ss:Bold="1"/>
   <Interior ss:Color="#FFE4E6" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECDD3"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECDD3"/>
   </Borders>
  </Style>
  <Style ss:ID="BadgeWarning">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9" ss:Color="#C2410C" ss:Bold="1"/>
   <Interior ss:Color="#FFEDD5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FED7AA"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FED7AA"/>
   </Borders>
  </Style>
  <Style ss:ID="BadgePrimary">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9" ss:Color="#0369A1" ss:Bold="1"/>
   <Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BAE6FD"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BAE6FD"/>
   </Borders>
  </Style>
  <Style ss:ID="BadgeP1">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9" ss:Color="#BE123C" ss:Bold="1"/>
   <Interior ss:Color="#FFE4E6" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="BadgeP2">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9" ss:Color="#C2410C" ss:Bold="1"/>
   <Interior ss:Color="#FFEDD5" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="BadgeP3">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9" ss:Color="#A16207" ss:Bold="1"/>
   <Interior ss:Color="#FEF9C3" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="BadgeP4">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="9" ss:Color="#0284C7" ss:Bold="1"/>
   <Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/>
  </Style>
 </Styles>
`;

    // ── SHEET 1: Tested URLs Summary ──────────────────────────────────────────
    xml += `
 <Worksheet ss:Name="Tested URLs Summary">
  <Table ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="280"/>
   <Column ss:AutoFitWidth="0" ss:Width="160"/>
   <Column ss:AutoFitWidth="0" ss:Width="260"/>
   <Column ss:AutoFitWidth="0" ss:Width="120"/>
   <Column ss:AutoFitWidth="0" ss:Width="85"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="80"/>
   <Column ss:AutoFitWidth="0" ss:Width="80"/>
   <Column ss:AutoFitWidth="0" ss:Width="85"/>
   <Column ss:AutoFitWidth="0" ss:Width="75"/>
   <Column ss:AutoFitWidth="0" ss:Width="75"/>
   <Column ss:AutoFitWidth="0" ss:Width="75"/>
   <Column ss:AutoFitWidth="0" ss:Width="75"/>
   <Column ss:AutoFitWidth="0" ss:Width="95"/>
   <Column ss:AutoFitWidth="0" ss:Width="95"/>
   <Column ss:AutoFitWidth="0" ss:Width="95"/>
   <Column ss:AutoFitWidth="0" ss:Width="95"/>
   <Column ss:AutoFitWidth="0" ss:Width="105"/>
   <Column ss:AutoFitWidth="0" ss:Width="95"/>
   <Column ss:AutoFitWidth="0" ss:Width="80"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="360"/>

   <!-- Table Header Row -->
   <Row ss:Height="26">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Tested URL</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Path / Endpoint</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Page Title</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Target Type</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">HTTP Status</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Overall Verdict</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Test Cycles</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Pass Rate</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Total Defects</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">P1 Critical</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">P2 High</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">P3 Medium</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">P4 Low</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Accessibility</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Security</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Functional</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Performance</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Avg Latency (ms)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Interactive Items</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Has Forms</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">First Tested</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Last Tested</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Defects Breakdown</Data></Cell>
   </Row>
`;

    urls.forEach((u) => {
      let verdictStyle = 'BadgeAllPassed';
      if (u.p1Count > 0) verdictStyle = 'BadgeCritical';
      else if (u.p2Count > 0) verdictStyle = 'BadgeWarning';
      else if (u.defectsTotal > 0) verdictStyle = 'BadgeWarning';

      const typeStyle = u.type === 'PRIMARY_TARGET' ? 'BadgePrimary' : 'CellCenter';

      xml += `
   <Row ss:Height="22">
    <Cell ss:StyleID="CellUrl"><Data ss:Type="String">${xmlEscape(u.url)}</Data></Cell>
    <Cell ss:StyleID="CellPath"><Data ss:Type="String">${xmlEscape(u.path)}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${xmlEscape(u.title)}</Data></Cell>
    <Cell ss:StyleID="${typeStyle}"><Data ss:Type="String">${xmlEscape(u.type)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${xmlEscape(u.statusCode)}</Data></Cell>
    <Cell ss:StyleID="${verdictStyle}"><Data ss:Type="String">${xmlEscape(u.health)}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${u.runsCount}</Data></Cell>
    <Cell ss:StyleID="CellPercent"><Data ss:Type="Number">${(u.passRatePct / 100).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="${u.defectsTotal > 0 ? (u.p1Count > 0 ? 'CellNumberP1' : 'CellNumberP2') : 'CellNumber'}"><Data ss:Type="Number">${u.defectsTotal}</Data></Cell>
    <Cell ss:StyleID="${u.p1Count > 0 ? 'CellNumberP1' : 'CellNumber'}"><Data ss:Type="Number">${u.p1Count}</Data></Cell>
    <Cell ss:StyleID="${u.p2Count > 0 ? 'CellNumberP2' : 'CellNumber'}"><Data ss:Type="Number">${u.p2Count}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${u.p3Count}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${u.p4Count}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${u.a11yCount}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${u.secCount}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${u.funcCount}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${u.perfCount}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${u.avgLatencyMs}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${u.interactiveCount}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${xmlEscape(u.hasForms)}</Data></Cell>
    <Cell ss:StyleID="CellDate"><Data ss:Type="String">${xmlEscape(formatDate(u.firstTested))}</Data></Cell>
    <Cell ss:StyleID="CellDate"><Data ss:Type="String">${xmlEscape(formatDate(u.lastTested))}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${xmlEscape(u.defectSummaries)}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
`;

    // ── SHEET 2: Defects Aligned By Tested URL ─────────────────────────────────
    xml += `
 <Worksheet ss:Name="Defects Aligned By URL">
  <Table ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="260"/>
   <Column ss:AutoFitWidth="0" ss:Width="160"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="70"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="75"/>
   <Column ss:AutoFitWidth="0" ss:Width="260"/>
   <Column ss:AutoFitWidth="0" ss:Width="320"/>
   <Column ss:AutoFitWidth="0" ss:Width="280"/>
   <Column ss:AutoFitWidth="0" ss:Width="260"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="130"/>

   <Row ss:Height="26">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Tested URL (Anchor)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Page Route</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Defect ID</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Severity</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Defect Title</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Summary &amp; Root Cause</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Reproduction Steps</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Suggested Fix</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Test Run ID</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">First Detected</Data></Cell>
   </Row>
`;

    defects.forEach((d) => {
      const sevStyle = d.severity === 'P1' ? 'BadgeP1' : d.severity === 'P2' ? 'BadgeP2' : d.severity === 'P3' ? 'BadgeP3' : 'BadgeP4';
      xml += `
   <Row ss:Height="22">
    <Cell ss:StyleID="CellUrl"><Data ss:Type="String">${xmlEscape(d.testedUrl)}</Data></Cell>
    <Cell ss:StyleID="CellPath"><Data ss:Type="String">${xmlEscape(d.endpoint)}</Data></Cell>
    <Cell ss:StyleID="CellPath"><Data ss:Type="String">${xmlEscape(d.defectId)}</Data></Cell>
    <Cell ss:StyleID="${sevStyle}"><Data ss:Type="String">${xmlEscape(d.severity)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${xmlEscape(d.category)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${xmlEscape(d.status)}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${xmlEscape(d.title)}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${xmlEscape(d.summary)}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${xmlEscape(d.reproduction)}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${xmlEscape(d.suggestedFix)}</Data></Cell>
    <Cell ss:StyleID="CellPath"><Data ss:Type="String">${xmlEscape(d.testRunId)}</Data></Cell>
    <Cell ss:StyleID="CellDate"><Data ss:Type="String">${xmlEscape(formatDate(d.firstSeen))}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
`;

    // ── SHEET 3: Performance & Core Web Vitals ─────────────────────────────────
    xml += `
 <Worksheet ss:Name="Performance &amp; CWV">
  <Table ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="260"/>
   <Column ss:AutoFitWidth="0" ss:Width="160"/>
   <Column ss:AutoFitWidth="0" ss:Width="120"/>
   <Column ss:AutoFitWidth="0" ss:Width="100"/>
   <Column ss:AutoFitWidth="0" ss:Width="100"/>
   <Column ss:AutoFitWidth="0" ss:Width="100"/>
   <Column ss:AutoFitWidth="0" ss:Width="90"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>

   <Row ss:Height="26">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Tested URL</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Route</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Navigation (ms)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">TTFB (ms)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">FCP (ms)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">LCP (ms)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">CLS (Layout Shift)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Total Requests</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">CWV Issues</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Test Run ID</Data></Cell>
   </Row>
`;

    performance.forEach((m) => {
      xml += `
   <Row ss:Height="22">
    <Cell ss:StyleID="CellUrl"><Data ss:Type="String">${xmlEscape(m.testedUrl)}</Data></Cell>
    <Cell ss:StyleID="CellPath"><Data ss:Type="String">${xmlEscape(m.endpoint)}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${m.navigationMs}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${m.ttfbMs}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${m.fcpMs}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${m.lcpMs}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${xmlEscape(m.cls.toFixed(3))}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${m.requestsCount}</Data></Cell>
    <Cell ss:StyleID="${m.issuesCount > 0 ? 'BadgeWarning' : 'BadgeAllPassed'}"><Data ss:Type="Number">${m.issuesCount}</Data></Cell>
    <Cell ss:StyleID="CellPath"><Data ss:Type="String">${xmlEscape(m.runId)}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
`;

    // ── SHEET 4: Discovered Endpoints Tree ─────────────────────────────────────
    xml += `
 <Worksheet ss:Name="Discovered Endpoints">
  <Table ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="240"/>
   <Column ss:AutoFitWidth="0" ss:Width="260"/>
   <Column ss:AutoFitWidth="0" ss:Width="160"/>
   <Column ss:AutoFitWidth="0" ss:Width="240"/>
   <Column ss:AutoFitWidth="0" ss:Width="90"/>
   <Column ss:AutoFitWidth="0" ss:Width="80"/>
   <Column ss:AutoFitWidth="0" ss:Width="120"/>
   <Column ss:AutoFitWidth="0" ss:Width="90"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>

   <Row ss:Height="26">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Parent Root URL</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Discovered Subpage URL</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Endpoint</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Page Title</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Depth</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Interactive Items</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Has Forms</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Load Time (ms)</Data></Cell>
   </Row>
`;

    endpoints.forEach((ep) => {
      xml += `
   <Row ss:Height="22">
    <Cell ss:StyleID="CellUrl"><Data ss:Type="String">${xmlEscape(ep.parentUrl)}</Data></Cell>
    <Cell ss:StyleID="CellUrl"><Data ss:Type="String">${xmlEscape(ep.pageUrl)}</Data></Cell>
    <Cell ss:StyleID="CellPath"><Data ss:Type="String">${xmlEscape(ep.endpoint)}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${xmlEscape(ep.title)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${xmlEscape(ep.statusCode)}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${ep.depth}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${ep.interactiveCount}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${xmlEscape(ep.hasForms)}</Data></Cell>
    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">${ep.loadTimeMs}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    return xml;
  }

  /**
   * Generates standard RFC-4180 CSV with UTF-8 BOM for Microsoft Excel & Google Sheets.
   * Primary alignment is tested URL per row with all metrics properly aligned.
   */
  function generateTestedUrlsSummaryCsv(dataset) {
    const headers = [
      'Tested URL',
      'Path / Endpoint',
      'Domain',
      'Page Title',
      'Target Type',
      'HTTP Status',
      'Overall Health',
      'Test Cycles Run',
      'Pass Rate %',
      'Total Defects',
      'P1 Critical',
      'P2 High',
      'P3 Medium',
      'P4 Low',
      'Accessibility Issues',
      'Security Issues',
      'Functional Issues',
      'Performance Issues',
      'Avg Latency (ms)',
      'Interactive Elements',
      'Forms Present',
      'First Tested At',
      'Last Tested At',
      'Defects Breakdown',
    ];

    const rows = [headers.map(csvEscape).join(',')];

    dataset.urls.forEach((u) => {
      const line = [
        csvEscape(u.url),
        csvEscape(u.path),
        csvEscape(u.domain),
        csvEscape(u.title),
        csvEscape(u.type),
        csvEscape(u.statusCode),
        csvEscape(u.health),
        u.runsCount,
        `${u.passRatePct}%`,
        u.defectsTotal,
        u.p1Count,
        u.p2Count,
        u.p3Count,
        u.p4Count,
        u.a11yCount || 0,
        u.secCount,
        u.funcCount,
        u.perfCount,
        u.avgLatencyMs,
        u.interactiveCount,
        csvEscape(u.hasForms),
        csvEscape(formatDate(u.firstTested)),
        csvEscape(formatDate(u.lastTested)),
        csvEscape(u.defectSummaries),
      ];
      rows.push(line.join(','));
    });

    // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 properly without garbled characters
    return '\uFEFF' + rows.join('\r\n');
  }

  /**
   * Generates CSV of all defects aligned by tested URL in the first column.
   */
  function generateDefectsByUrlCsv(dataset) {
    const headers = [
      'Tested URL',
      'Page Route',
      'Page Title',
      'Defect ID',
      'Severity',
      'Category',
      'Status',
      'Defect Title',
      'Defect Summary',
      'Root Cause Analysis',
      'Reproduction Steps',
      'Suggested Remediation Fix',
      'Test Run ID',
      'First Detected Timestamp',
    ];

    const rows = [headers.map(csvEscape).join(',')];

    dataset.defects.forEach((d) => {
      const line = [
        csvEscape(d.testedUrl),
        csvEscape(d.endpoint),
        csvEscape(d.pageTitle),
        csvEscape(d.defectId),
        csvEscape(d.severity),
        csvEscape(d.category),
        csvEscape(d.status),
        csvEscape(d.title),
        csvEscape(d.summary),
        csvEscape(d.rootCause),
        csvEscape(d.reproduction),
        csvEscape(d.suggestedFix),
        csvEscape(d.testRunId),
        csvEscape(formatDate(d.firstSeen)),
      ];
      rows.push(line.join(','));
    });

    return '\uFEFF' + rows.join('\r\n');
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  const Exporter = {
    compileDataset,

    async exportExcel(items, allDefects, allRuns, allCrawlSessions, options = {}) {
      const dataset = compileDataset(items, allDefects, allRuns, allCrawlSessions);
      const filename = options.filename || `TestPilot_Tested_URLs_Report_${getTimestampSuffix()}.xlsx`;

      // 1. Primary: Generate true modern .xlsx binary via ExcelJS in browser
      if (window.ExcelJS) {
        try {
          const buffer = await generateExcelXlsx(dataset);
          downloadBlob(buffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          return { success: true, count: dataset.urls.length, filename };
        } catch (err) {
          console.warn('Client ExcelJS export failed, trying server-side xlsx endpoint:', err);
        }
      }

      // 2. Fallback: Request true binary .xlsx directly from server endpoint
      try {
        const response = await fetch('/api/export/sheet?format=xlsx');
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 150);
          return { success: true, count: dataset.urls.length, filename };
        }
      } catch (err) {
        console.warn('Server fetch export failed, using XML spreadsheetML:', err);
      }

      // 3. Secondary Fallback: SpreadsheetML XML
      const xml = generateExcelSpreadsheetXml(dataset);
      downloadBlob(xml, filename.replace(/\.xlsx$/, '.xls'), 'application/vnd.ms-excel;charset=utf-8');
      return { success: true, count: dataset.urls.length, filename };
    },

    exportSummaryCsv(items, allDefects, allRuns, allCrawlSessions, options = {}) {
      const dataset = compileDataset(items, allDefects, allRuns, allCrawlSessions);
      const csv = generateTestedUrlsSummaryCsv(dataset);
      const filename = options.filename || `TestPilot_Tested_URLs_Summary_${getTimestampSuffix()}.csv`;
      downloadBlob(csv, filename, 'text/csv;charset=utf-8');
      return { success: true, count: dataset.urls.length, filename };
    },

    exportDefectsCsv(items, allDefects, allRuns, allCrawlSessions, options = {}) {
      const dataset = compileDataset(items, allDefects, allRuns, allCrawlSessions);
      const csv = generateDefectsByUrlCsv(dataset);
      const filename = options.filename || `TestPilot_Defects_By_Tested_URL_${getTimestampSuffix()}.csv`;
      downloadBlob(csv, filename, 'text/csv;charset=utf-8');
      return { success: true, count: dataset.defects.length, filename };
    },

    async exportSingleUrlDossier(urlItem, allDefects, allRuns, allCrawlSessions, format = 'xlsx') {
      const items = [urlItem];
      const targetSlug = urlItem.url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const filename = `TestPilot_Dossier_${targetSlug}_${getTimestampSuffix()}.${format === 'csv' ? 'csv' : 'xlsx'}`;

      if (format === 'csv') {
        return this.exportSummaryCsv(items, allDefects, allRuns, allCrawlSessions, { filename });
      }
      return await this.exportExcel(items, allDefects, allRuns, allCrawlSessions, { filename });
    },
  };

  window.TestPilotSheetExporter = Exporter;
})(window);
