const fs = require('fs');
const path = require('path');
const { Before, After, AfterAll, Status, setDefaultTimeout } = require('@cucumber/cucumber');
const { createBrowser, createContext } = require('./browser-factory');
const { initExecutionPaths, screenshotsDir } = require('../utils/execution-paths');
const { startIfRequired, stopIfRequired } = require('../grid/remote-grid-manager');
const logger = require('../logging/framework-logger').getLogger('Hooks');

setDefaultTimeout(60_000);

Before(async function (scenario) {
  initExecutionPaths();
  logger.phase('SCENARIO', 'START - {}', scenario.pickle.name);

  if (!scenario.pickle.tags.some((tag) => tag.name === '@selenium-run')) {
    return;
  }

  await startIfRequired();
  this.browser = await createBrowser();
  this.context = await createContext(this.browser);
  this.page = await this.context.newPage();
  this.setPage(this.page);
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

  logger.phase('SCENARIO', 'END - {}', scenario.pickle.name);
});

AfterAll(async function () {
  stopIfRequired();
});

function safeFileName(value) {
  return value.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}
