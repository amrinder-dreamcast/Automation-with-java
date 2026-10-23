/**
 * Playwright MCP Toolset
 * Purpose: Automate a browser & inspect the DOM via Accessibility-tree parsing.
 */

import { chromium, Browser, Page } from 'playwright';
import { MCPTool, MCPToolHandler } from '../base/types.js';
import { formatSuccess } from '../base/resilience.js';

let sharedBrowser: Browser | null = null;
let sharedPage: Page | null = null;

async function getOrCreatePage(): Promise<Page> {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    sharedBrowser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  if (!sharedPage || sharedPage.isClosed()) {
    const context = await sharedBrowser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestPilot-Playwright-MCP/1.0',
    });
    sharedPage = await context.newPage();
  }
  return sharedPage;
}

export const playwrightNavigateTool: MCPTool = {
  name: 'playwright_navigate',
  description: 'Navigate the browser to a URL and return title, status code, and timing metrics.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Target URL to navigate to' },
      timeout: { type: 'number', description: 'Timeout in ms (default 30000)' },
    },
    required: ['url'],
  },
};

export const playwrightNavigateHandler: MCPToolHandler = async (args) => {
  const page = await getOrCreatePage();
  const startTime = Date.now();
  const response = await page.goto(args.url, {
    timeout: args.timeout || 30000,
    waitUntil: 'domcontentloaded',
  });
  const durationMs = Date.now() - startTime;

  return formatSuccess({
    status: 'NAVIGATED',
    url: page.url(),
    httpStatus: response?.status() ?? 200,
    title: await page.title(),
    durationMs,
  });
};

export const playwrightInspectDomTool: MCPTool = {
  name: 'playwright_inspect_dom',
  description:
    'Extracts the clean, semantic Accessibility Tree (AX tree) and key interactive elements that AI agents can reason over, avoiding token bloat.',
  inputSchema: {
    type: 'object',
    properties: {
      rootSelector: {
        type: 'string',
        description: 'Optional CSS selector to scope the inspection',
      },
      includeInteractivity: {
        type: 'boolean',
        description: 'Whether to include list of clickable buttons, links, inputs',
      },
    },
  },
};

export const playwrightInspectDomHandler: MCPToolHandler = async (args) => {
  const page = await getOrCreatePage();
  
  // Extract Accessibility Snapshot
  const snapshot = await (page as any).accessibility?.snapshot({
    root: args.rootSelector ? await page.$(args.rootSelector) : undefined,
    interestingOnly: true,
  });

  // Extract interactive elements summary
  let interactiveNodes: any[] = [];
  if (args.includeInteractivity !== false) {
    interactiveNodes = await page.$$eval(
      'button, a, input, select, textarea, [role="button"], [role="link"]',
      (elements) =>
        elements.slice(0, 50).map((el, index) => {
          const rect = el.getBoundingClientRect();
          return {
            index,
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute('role') || el.tagName.toLowerCase(),
            name: el.getAttribute('aria-label') || (el as HTMLElement).innerText?.trim().slice(0, 60) || (el as HTMLInputElement).value || '',
            id: el.id || null,
            href: (el as HTMLAnchorElement).href || null,
            visible: rect.width > 0 && rect.height > 0,
          };
        })
    );
  }

  return formatSuccess({
    url: page.url(),
    title: await page.title(),
    accessibilityTree: snapshot,
    interactiveElementsCount: interactiveNodes.length,
    interactiveElements: interactiveNodes,
  });
};

export const playwrightClickTool: MCPTool = {
  name: 'playwright_click',
  description: 'Clicks an element on the active page by CSS selector, text, or role.',
  inputSchema: {
    type: 'object',
    properties: {
      selector: { type: 'string', description: 'CSS selector or text locator (e.g. text="Submit")' },
      timeout: { type: 'number', description: 'Timeout in ms (default 10000)' },
    },
    required: ['selector'],
  },
};

export const playwrightClickHandler: MCPToolHandler = async (args) => {
  const page = await getOrCreatePage();
  await page.click(args.selector, { timeout: args.timeout || 10000 });
  await page.waitForTimeout(300);
  return formatSuccess({
    status: 'CLICKED',
    selector: args.selector,
    currentUrl: page.url(),
    title: await page.title(),
  });
};

export const playwrightTypeTool: MCPTool = {
  name: 'playwright_type',
  description: 'Fills or types text into an input or textarea element.',
  inputSchema: {
    type: 'object',
    properties: {
      selector: { type: 'string', description: 'CSS selector of the input field' },
      text: { type: 'string', description: 'Text to type into the field' },
      clearFirst: { type: 'boolean', description: 'Whether to clear existing text' },
    },
    required: ['selector', 'text'],
  },
};

export const playwrightTypeHandler: MCPToolHandler = async (args) => {
  const page = await getOrCreatePage();
  if (args.clearFirst !== false) {
    await page.fill(args.selector, '');
  }
  await page.fill(args.selector, args.text);
  return formatSuccess({
    status: 'TYPED',
    selector: args.selector,
    length: args.text.length,
  });
};

export const playwrightScreenshotTool: MCPTool = {
  name: 'playwright_screenshot',
  description: 'Captures a full-page or element screenshot in base64 or saves to path.',
  inputSchema: {
    type: 'object',
    properties: {
      fullPage: { type: 'boolean', description: 'Capture entire scrolling page' },
      selector: { type: 'string', description: 'Specific element to screenshot' },
    },
  },
};

export const playwrightScreenshotHandler: MCPToolHandler = async (args) => {
  const page = await getOrCreatePage();
  let buffer: Buffer;
  if (args.selector) {
    const el = await page.$(args.selector);
    if (!el) throw new Error(`Element matching '${args.selector}' not found`);
    buffer = await el.screenshot();
  } else {
    buffer = await page.screenshot({ fullPage: args.fullPage ?? false });
  }

  return formatSuccess({
    status: 'CAPTURED',
    byteSize: buffer.length,
    base64Preview: `data:image/png;base64,${buffer.slice(0, 1024).toString('base64')}... [truncated]`,
  });
};

export const playwrightTools = [
  { tool: playwrightNavigateTool, handler: playwrightNavigateHandler },
  { tool: playwrightInspectDomTool, handler: playwrightInspectDomHandler },
  { tool: playwrightClickTool, handler: playwrightClickHandler },
  { tool: playwrightTypeTool, handler: playwrightTypeHandler },
  { tool: playwrightScreenshotTool, handler: playwrightScreenshotHandler },
];
