const { Given } = require('@cucumber/cucumber');
const { config } = require('../framework/config/config-manager');

Given('I open the {string} login page', async function (urlKey) {
  const url = config.get(urlKey);
  if (!url) {
    throw new Error(`No URL found in config for key: ${urlKey}`);
  }

  await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
});
