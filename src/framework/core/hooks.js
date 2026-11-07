const fs = require('fs');
const path = require('path');
const { Before, After, AfterAll, Status, setDefaultTimeout } = require('@cucumber/cucumber');
const { createBrowser, createContext } = require('./browser-factory');
const { ApiClient } = require('../api/api-client');
const { config } = require('../config/config-manager');
const { serveFolder, stopAll } = require('./static-server');
const { installHalagaNativeBridge } = require('../halaga/native-bridge-stub');
const { initExecutionPaths, screenshotsDir } = require('../utils/execution-paths');
const { startIfRequired, stopIfRequired } = require('../grid/remote-grid-manager');
const logger = require('../logging/framework-logger').getLogger('Hooks');

setDefaultTimeout(60_000);

Before(async function (scenario) {
  initExecutionPaths();
  logger.phase('SCENARIO', 'START - {}', scenario.pickle.name);

  const tags = scenario.pickle.tags.map((tag) => tag.name);

  if (tags.includes('@api')) {
    this.api = await ApiClient.create();
  }

  if (tags.includes('@database')) {
    await this.db.connect();
  }

  if (tags.includes('@halaga')) {
    await openHalaga(this);
  } else if (shouldCreateBrowser(tags)) {
    await startIfRequired();
    this.browser = await createBrowser();
    this.context = await createContext(this.browser);
    this.page = await this.context.newPage();
    this.setPage(this.page);
  }
});

After(async function (scenario) {
  if (scenario.result?.status === Status.FAILED && this.page) {
    const screenshotPath = path.join(screenshotsDir, `${Date.now()}-${safeFileName(scenario.pickle.name)}.png`);
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    const screenshot = await this.page.screenshot({ path: screenshotPath, fullPage: true });
    this.attach(screenshot, 'image/png');
  }

  if (this.context) {
    await this.context.close();
  }

  if (this.browser) {
    await this.browser.close();
  }

  if (this.api) {
    await this.api.dispose();
  }

  await this.db.disconnect();

  logger.phase('SCENARIO', 'END - {}', scenario.pickle.name);
});

AfterAll(async function () {
  stopIfRequired();
  await stopAll();
});

/**
 * Halaga is an iOS app whose screens are a web bundle shown in a WKWebView, so it is tested in
 * Playwright's WebKit with iPhone emulation, served from a local folder. Each scenario gets a fresh
 * context, which means empty IndexedDB, like a fresh install. Requests to any other host are
 * blocked so tests never reach cloud sync or Claude.
 */
async function openHalaga(world) {
  const appDir = config.get('app.halaga.dir');
  if (!appDir) {
    throw new Error('Set app.halaga.dir in config/global.properties to the Halaga web bundle folder');
  }

  world.halagaUrl = await serveFolder(appDir.replace(/^~(?=\/)/, process.env.HOME));
  world.browser = await createBrowser({ browser: config.get('app.halaga.browser', 'webkit') });
  world.context = await createContext(world.browser, {
    device: config.get('app.halaga.device', 'iPhone 14 Pro'),
    contextOptions: { serviceWorkers: 'block' }
  });
  // native (default): behave like the iOS app through a stub of its WKWebView bridge; web: the plain web build
  if (config.get('app.halaga.mode', 'native').toLowerCase() === 'native') {
    await world.context.addInitScript(installHalagaNativeBridge, {
      lockAvailable: true,
      biometry: config.get('app.halaga.biometry', 'faceID')
    });
  }
  const origin = new URL(world.halagaUrl).origin;
  await world.context.route('**/*', (route) =>
    route.request().url().startsWith(origin) ? route.continue() : route.abort());
  world.page = await world.context.newPage();
  world.page.on('dialog', (dialog) => dialog.accept());
  world.setPage(world.page);
}

function safeFileName(value) {
  return value.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function shouldCreateBrowser(tags) {
  return tags.includes('@ui') || tags.includes('@pom') || tags.includes('@selenium-run');
}
