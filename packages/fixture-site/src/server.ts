import * as http from 'node:http';
import { URL } from 'node:url';

export interface FixtureServerOptions {
  port?: number;
}

export function createFixtureServer(): http.Server {
  const sessions = new Set<string>();

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // Helper to send HTML
    const sendHtml = (status: number, body: string, extraHeaders: Record<string, string> = {}) => {
      res.writeHead(status, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Powered-By': 'TestPilot-Fixture-Bench',
        ...extraHeaders,
      });
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TestPilot Benchmark Fixture</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; background: #0f172a; color: #f8fafc; }
    nav { background: #1e293b; padding: 12px 20px; border-radius: 8px; margin-bottom: 24px; display: flex; gap: 16px; flex-wrap: wrap; }
    nav a { color: #38bdf8; text-decoration: none; font-weight: 500; }
    nav a:hover { text-decoration: underline; }
    .card { background: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 20px; }
    .btn { background: #2563eb; color: #fff; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .btn:hover { background: #1d4ed8; }
    .btn-danger { background: #dc2626; }
    .btn-danger:hover { background: #b91c1c; }
    input, select, textarea { background: #0f172a; border: 1px solid #475569; color: #fff; padding: 8px 12px; border-radius: 6px; width: 100%; max-width: 320px; margin-bottom: 12px; display: block; }
    .alert-box { padding: 12px; border-radius: 6px; margin: 12px 0; }
    .alert-danger { background: #450a0a; border: 1px solid #991b1b; color: #fca5a5; }
    .alert-success { background: #052e16; border: 1px solid #166534; color: #86efac; }
  </style>
</head>
<body>
  <nav>
    <a href="/" id="nav-home">Home</a>
    <a href="/broken-links" id="nav-broken-links">Broken Links</a>
    <a href="/forms" id="nav-forms">Forms & Inputs</a>
    <a href="/accessibility" id="nav-a11y">Accessibility Violations</a>
    <a href="/console-errors" id="nav-console">Console Errors</a>
    <a href="/performance" id="nav-perf">Performance Lag</a>
    <a href="/api-failures" id="nav-api">API Failures</a>
    <a href="/auth/login" id="nav-auth">Authentication</a>
    <a href="/visual" id="nav-visual">Visual Regression</a>
  </nav>
  ${body}
</body>
</html>`);
    };

    // 1. Homepage
    if (pathname === '/') {
      return sendHtml(200, `
        <h1>TestPilot Benchmark Ground-Truth Target</h1>
        <p>This application contains intentional real-world web defects across functional, accessibility, performance, visual, and security dimensions to rigorously validate the TestPilot AI testing engine.</p>
        <div class="card">
          <h2>Interactive Elements</h2>
          <button id="counter-btn" class="btn" onclick="let c=document.getElementById('counter'); c.innerText=parseInt(c.innerText)+1;">Increment Counter: <span id="counter">0</span></button>
        </div>
      `);
    }

    // 2. Broken Links & Redirect Loops
    if (pathname === '/broken-links') {
      return sendHtml(200, `
        <h1>Broken Links & Redirect Verification</h1>
        <div class="card">
          <p>Test link detection and error reporting:</p>
          <ul>
            <li><a href="/" id="valid-link">Valid Internal Link (Home)</a></li>
            <li><a href="/broken-target-404" id="broken-404-link">Broken 404 Target Link</a></li>
            <li><a href="/loop-a" id="redirect-loop-link">Infinite Redirect Loop (A &harr; B)</a></li>
          </ul>
        </div>
      `);
    }

    if (pathname === '/broken-target-404') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found - Intentional broken link target');
    }

    if (pathname === '/loop-a') {
      res.writeHead(302, { Location: '/loop-b' });
      return res.end();
    }
    if (pathname === '/loop-b') {
      res.writeHead(302, { Location: '/loop-a' });
      return res.end();
    }

    // 3. Forms & Inputs
    if (pathname === '/forms') {
      if (req.method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => bodyStr += chunk);
        req.on('end', () => {
          if (bodyStr.includes('trigger_error=true')) {
            return sendHtml(500, `
              <div class="alert-box alert-danger" id="form-error-msg">
                <h3>500 Internal Server Error</h3>
                <p>Form submission failed due to an unhandled backend exception.</p>
              </div>
            `);
          }
          return sendHtml(200, `
            <div class="alert-box alert-success" id="form-success-msg">
              <h3>Form Submitted Successfully</h3>
              <p>Received payload: ${bodyStr}</p>
            </div>
            <a href="/forms" class="btn">Back to Forms</a>
          `);
        });
        return;
      }

      return sendHtml(200, `
        <h1>Form Interaction & Validation Testing</h1>
        <div class="card">
          <h2>Valid Form</h2>
          <form action="/forms" method="POST" id="valid-test-form">
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required placeholder="john_doe" />
            <label for="email">Email Address:</label>
            <input type="email" id="email" name="email" required placeholder="john@example.com" />
            <button type="submit" id="submit-valid-form" class="btn">Submit Valid Form</button>
          </form>
        </div>

        <div class="card">
          <h2>Crashing Client-Side Form</h2>
          <p>Clicking this button triggers an uncaught JavaScript runtime error during click handler execution.</p>
          <button id="btn-js-crash" class="btn btn-danger" onclick="nullPointerCrashFunction.call()">Submit and Crash JS</button>
        </div>
      `);
    }

    // 4. Accessibility Violations (WCAG AA intentionally broken)
    if (pathname === '/accessibility') {
      return sendHtml(200, `
        <h1>Accessibility (a11y) Violations Ground Truth</h1>
        
        <div class="card">
          <!-- WCAG Violation: Image missing alt attribute -->
          <h3>Image without Alternative Text</h3>
          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='40'><rect fill='%2338bdf8' width='100' height='40'/></svg>" id="a11y-img-no-alt" />
        </div>

        <div class="card">
          <!-- WCAG Violation: Form input without associated label or aria-label -->
          <h3>Input without Label</h3>
          <input type="text" id="unlabeled-input" placeholder="No label attached" />
        </div>

        <div class="card">
          <!-- WCAG Violation: Empty button with no accessible text name -->
          <h3>Button with No Accessible Name</h3>
          <button id="empty-icon-btn" class="btn"><span class="icon">🔍</span></button>
        </div>

        <div class="card">
          <!-- WCAG Violation: Poor color contrast (light gray text on light gray background) -->
          <h3>Insufficient Color Contrast</h3>
          <p id="low-contrast-text" style="background-color: #e2e8f0; color: #94a3b8; padding: 12px; font-size: 13px;">
            This text fails WCAG 2.1 AA contrast requirements (contrast ratio &lt; 3:1).
          </p>
        </div>
      `);
    }

    // 5. Console Errors
    if (pathname === '/console-errors') {
      return sendHtml(200, `
        <h1>Console Errors & Exceptions</h1>
        <p>This page automatically throws runtime errors on DOM content load.</p>
        <script>
          console.error("TestPilot Fixture: Uncaught reference in payment gateway SDK initialization.");
          setTimeout(() => {
            window.nonExistentAnalyticsService.trackPageView();
          }, 100);
        </script>
      `);
    }

    // 6. Performance Lag
    if (pathname === '/performance') {
      // Simulate artificial server latency of 1500ms
      setTimeout(() => {
        sendHtml(200, `
          <h1>Performance & Latency Benchmark</h1>
          <p>This page was intentionally delayed by 1500ms to test TTFB and Navigation Timing budgets.</p>
        `);
      }, 1500);
      return;
    }

    // 7. API Failures
    if (pathname === '/api-failures') {
      return sendHtml(200, `
        <h1>API Failure Testing</h1>
        <div class="card">
          <button id="btn-api-success" class="btn" onclick="fetch('/api/status').then(r=>r.json()).then(d=>document.getElementById('api-result').innerText=JSON.stringify(d))">Call 200 OK API</button>
          <button id="btn-api-fail" class="btn btn-danger" onclick="fetch('/api/error-500').then(r=>r.text()).then(t=>document.getElementById('api-result').innerText='Failed: ' + t)">Call 500 Internal Error API</button>
          <pre id="api-result" style="background:#020617; padding:12px; margin-top:12px; border-radius:4px;">No API call made yet</pre>
        </div>
      `);
    }

    if (pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    }

    if (pathname === '/api/error-500') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Database connection failed', code: 'DB_ERR_500' }));
    }

    // 8. Authentication
    if (pathname === '/auth/login') {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          if (body.includes('admin%40testpilot.ai') && body.includes('pilotPass123!')) {
            const token = 'session_' + Math.random().toString(36).substring(2);
            sessions.add(token);
            res.writeHead(302, {
              'Set-Cookie': `session_id=${token}; Path=/; HttpOnly; SameSite=Lax`,
              Location: '/auth/dashboard',
            });
            return res.end();
          }
          return sendHtml(401, `
            <div class="alert-box alert-danger" id="login-error-banner">Invalid credentials. Please verify username and password.</div>
            <a href="/auth/login" class="btn">Try Again</a>
          `);
        });
        return;
      }

      return sendHtml(200, `
        <div style="max-width: 420px; margin: 40px auto; background: #1e293b; padding: 36px 32px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <h1 style="text-align: center; font-size: 26px; font-weight: 800; margin: 0 0 24px 0; color: #f8fafc;">Sign in</h1>
          <form action="/auth/login" method="POST" id="auth-form" style="display: flex; flex-direction: column;">
            <div style="margin-bottom: 18px;">
              <label for="auth-email" style="display: block; font-size: 13.5px; font-weight: 600; margin-bottom: 6px; color: #f8fafc;">
                Email address<span style="color: #ef4444; font-weight: 700; margin-left: 2px;">*</span>
              </label>
              <input type="email" id="auth-email" name="email" required value="admin@testpilot.ai" style="width: 100%; box-sizing: border-box; max-width: 100%; padding: 11px 14px; border-radius: 8px; border: 1.5px solid #475569; background: #0f172a; color: #fff; font-size: 14.5px;" />
            </div>

            <div style="margin-bottom: 18px;">
              <label for="auth-pass" style="display: block; font-size: 13.5px; font-weight: 600; margin-bottom: 6px; color: #f8fafc;">
                Password<span style="color: #ef4444; font-weight: 700; margin-left: 2px;">*</span>
              </label>
              <div style="position: relative; display: flex; align-items: center;">
                <input type="password" id="auth-pass" name="password" required value="pilotPass123!" style="width: 100%; box-sizing: border-box; max-width: 100%; padding: 11px 48px 11px 14px; border-radius: 8px; border: 1.5px solid #475569; background: #0f172a; color: #fff; font-size: 14.5px; letter-spacing: 0.1em;" />
                <button type="button" id="btn-fixture-toggle-pw" onclick="const p=document.getElementById('auth-pass'); const isPw=p.type==='password'; p.type=isPw?'text':'password'; this.innerText=isPw?'👁️‍🗨️':'👁️';" style="position: absolute; right: 10px; background: transparent; border: none; cursor: pointer; color: #94a3b8; font-size: 16px; padding: 6px;" aria-label="Toggle password">👁️</button>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0 22px 0;">
              <input type="checkbox" id="auth-remember" name="remember" checked style="width: 17px; height: 17px; accent-color: #dc2626; margin: 0; cursor: pointer;" />
              <label for="auth-remember" style="font-size: 13.5px; color: #94a3b8; cursor: pointer; user-select: none;">Remember me</label>
            </div>

            <button type="submit" id="btn-login-submit" class="btn" style="background: #dc2626; color: #fff; width: 100%; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 15px; border: none; cursor: pointer; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.35); transition: background 0.2s;">
              Sign in
            </button>
          </form>
        </div>
      `);
    }

    if (pathname === '/auth/dashboard') {
      const cookieHeader = req.headers.cookie || '';
      const hasValidSession = Array.from(sessions).some(s => cookieHeader.includes(`session_id=${s}`));

      if (!hasValidSession) {
        res.writeHead(302, { Location: '/auth/login' });
        return res.end();
      }

      return sendHtml(200, `
        <h1>Authorized Admin Dashboard</h1>
        <div class="card" id="dashboard-content">
          <p>Welcome, Authorized Administrator! Secret project tokens unlocked.</p>
          <a href="/auth/logout" class="btn btn-danger">Log Out</a>
        </div>
      `);
    }

    if (pathname === '/auth/logout') {
      res.writeHead(302, {
        'Set-Cookie': 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        Location: '/auth/login',
      });
      return res.end();
    }

    // 9. Visual Regression Verification
    if (pathname === '/visual') {
      const isRegressed = parsedUrl.searchParams.get('regress') === 'true';
      return sendHtml(200, `
        <h1>Visual Regression Testing Target</h1>
        <div class="card" style="text-align: center; padding: 40px; ${isRegressed ? 'background: #7f1d1d; border: 4px solid #ef4444;' : 'background: #1e293b;'}">
          <h2 id="banner-title" style="${isRegressed ? 'color: #fca5a5; font-size: 32px; transform: rotate(-2deg);' : 'color: #38bdf8; font-size: 24px;'}">
            ${isRegressed ? '💥 UNEXPECTED LAYOUT REGRESSION ACTIVE' : 'Standard Baseline Banner'}
          </h2>
          <p id="banner-desc">
            ${isRegressed ? 'Layout shifted! Dimensions changed, background altered, text displaced.' : 'This is the verified baseline visual appearance.'}
          </p>
          <a href="/visual${isRegressed ? '' : '?regress=true'}" class="btn" id="toggle-visual-diff">
            ${isRegressed ? 'Reset to Baseline' : 'Trigger Layout Regression'}
          </a>
        </div>
      `);
    }

    // Default 404
    sendHtml(404, `<h1>404 Not Found</h1><p>Requested resource does not exist.</p>`);
  });

  return server;
}

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  const port = parseInt(process.env.FIXTURE_PORT || '4000', 10);
  const server = createFixtureServer();
  server.listen(port, () => {
    console.log(`[TestPilot Fixture Benchmark Server] Running on http://localhost:${port}`);
  });
}
