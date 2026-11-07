const { chromium, firefox, webkit, devices } = require('playwright');
const { config } = require('../config/config-manager');
const logger = require('../logging/framework-logger').getLogger('BrowserFactory');

const browsers = {
  chromium,
  chrome: chromium,
  firefox,
  webkit
};

function executionMode() {
  return (process.env.EXECUTION_MODE || config.get('execution.mode', 'local')).toLowerCase();
}

function browserName(override) {
  return (override || process.env.BROWSER || config.get('execution.browser', 'chromium')).toLowerCase();
}

function shouldRunHeadless(mode) {
  if (mode === 'remote-local' || mode === 'remote-grid') {
    return true;
  }

  const explicitHeadless = process.env.HEADLESS ?? config.get('execution.headless', 'false');
  return String(explicitHeadless).toLowerCase() === 'true';
}

async function createBrowser(options = {}) {
  const mode = executionMode();
  const name = browserName(options.browser);
  const headless = shouldRunHeadless(mode);
  const browserType = browsers[name] || chromium;

  logger.phase('BROWSER', 'Starting {} with mode={} headless={}', name, mode, headless);

  if (mode === 'remote-grid') {
    const gridUrl = config.get('remote.grid.url', 'ws://127.0.0.1:4444/');
    return chromium.connect(gridUrl);
  }

  // these are Chromium switches; WebKit on Linux refuses to start with unknown options
  const args = browserType === chromium
    ? ['--disable-dev-shm-usage', '--disable-notifications', '--no-sandbox']
    : [];

  return browserType.launch({ headless, args });
}

/**
 * options.device: a Playwright device name (for example "iPhone 14 Pro") to emulate a phone's
 * screen, touch, user agent and pixel ratio instead of the 1920x1080 desktop viewport.
 */
async function createContext(browser, options = {}) {
  const device = options.device ? devices[options.device] : null;
  if (options.device && !device) {
    throw new Error(`Unknown Playwright device: ${options.device}`);
  }

  return browser.newContext({
    ...(device || { viewport: { width: 1920, height: 1080 } }),
    ...(options.contextOptions || {}),
    ignoreHTTPSErrors: true,
    recordVideo: process.env.PWVIDEO ? { dir: 'target/videos' } : undefined
  });
}

module.exports = {
  createBrowser,
  createContext,
  executionMode
};
