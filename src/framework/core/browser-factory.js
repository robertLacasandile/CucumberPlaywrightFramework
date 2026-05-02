const { chromium, firefox, webkit } = require('playwright');
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

function browserName() {
  return (process.env.BROWSER || config.get('execution.browser', 'chromium')).toLowerCase();
}

function shouldRunHeadless(mode) {
  if (mode === 'remote-local' || mode === 'remote-grid') {
    return true;
  }

  const explicitHeadless = process.env.HEADLESS ?? config.get('execution.headless', 'false');
  return String(explicitHeadless).toLowerCase() === 'true';
}

async function createBrowser() {
  const mode = executionMode();
  const name = browserName();
  const headless = shouldRunHeadless(mode);
  const browserType = browsers[name] || chromium;

  logger.phase('BROWSER', 'Starting {} with mode={} headless={}', name, mode, headless);

  if (mode === 'remote-grid') {
    const gridUrl = config.get('remote.grid.url', 'ws://127.0.0.1:4444/');
    return chromium.connect(gridUrl);
  }

  return browserType.launch({
    headless,
    args: [
      '--disable-dev-shm-usage',
      '--disable-notifications',
      '--no-sandbox'
    ]
  });
}

async function createContext(browser) {
  return browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    recordVideo: process.env.PWVIDEO ? { dir: 'target/videos' } : undefined
  });
}

module.exports = {
  createBrowser,
  createContext,
  executionMode
};
