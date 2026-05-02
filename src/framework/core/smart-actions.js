const { expect } = require('@playwright/test');
const { protect } = require('../utils/sensitive-data-protector');
const { SmartLocatorEngine } = require('./smart-locators');
const logger = require('../logging/framework-logger').getLogger('SmartActions');

class SmartActions {
  constructor(page) {
    this.page = page;
    this.smartLocators = new SmartLocatorEngine(page);
  }

  async click(referenceText) {
    logger.phase('ACTION', 'CLICK -> {}', referenceText);
    const target = await this.smartLocators.resolve('click', referenceText);
    await target.locator.scrollIntoViewIfNeeded();
    await target.locator.click({ timeout: 15_000 });
    await this.waitAfterAction();
  }

  async type(referenceText, value) {
    logger.phase('ACTION', 'TYPE -> {} value={}', referenceText, protect(referenceText, value));
    const target = await this.smartLocators.resolve('type', referenceText);
    await target.locator.scrollIntoViewIfNeeded();
    await target.locator.fill(String(value), { timeout: 15_000 });
    await this.waitAfterAction();
  }

  async clear(referenceText) {
    logger.phase('ACTION', 'CLEAR -> {}', referenceText);
    const target = await this.smartLocators.resolve('type', referenceText);
    await target.locator.fill('', { timeout: 15_000 });
  }

  async check(referenceText) {
    logger.phase('ACTION', 'CHECK -> {}', referenceText);
    const target = await this.smartLocators.resolve('check', referenceText);
    await target.locator.check({ timeout: 15_000 });
    await this.waitAfterAction();
  }

  async select(referenceText, visibleText) {
    logger.phase('ACTION', 'SELECT -> {} = {}', referenceText, visibleText);
    const target = await this.smartLocators.resolve('select', referenceText);
    await target.locator.selectOption({ label: visibleText });
    await this.waitAfterAction();
  }

  async selectGroupedDropdown(referenceText, position, visibleText) {
    logger.phase('ACTION', 'SELECT GROUPED -> {} at {} = {}', referenceText, position, visibleText);
    const dropdown = this.page.locator('select').nth(Number(position) - 1);
    await dropdown.selectOption({ label: visibleText });
    await this.waitAfterAction();
  }

  async pressKey(referenceText, key) {
    logger.phase('ACTION', 'KEY -> {} = {}', referenceText, key);
    const target = await this.smartLocators.resolve('type', referenceText);
    await target.locator.press(key);
  }

  async expectText(expectedText) {
    await expect(this.page.locator('body')).toContainText(expectedText, { timeout: 15_000 });
  }

  async waitAfterAction() {
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
  }
}

module.exports = {
  SmartActions
};
