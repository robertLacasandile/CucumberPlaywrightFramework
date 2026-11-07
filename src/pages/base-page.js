const { expect } = require('@playwright/test');

class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(url, options = {}) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000, ...options });
    await this.waitForPageReady();
  }

  locator(selector) {
    return this.page.locator(selector);
  }

  byRole(role, options) {
    return this.page.getByRole(role, options);
  }

  byText(text, options = {}) {
    return this.page.getByText(text, options);
  }

  byLabel(label, options = {}) {
    return this.page.getByLabel(label, options);
  }

  byPlaceholder(placeholder, options = {}) {
    return this.page.getByPlaceholder(placeholder, options);
  }

  async click(target) {
    await target.scrollIntoViewIfNeeded();
    await target.click({ timeout: 15_000 });
    await this.waitForPageReady();
  }

  async fill(target, value) {
    await target.scrollIntoViewIfNeeded();
    await target.fill(String(value), { timeout: 15_000 });
  }

  async selectByLabel(target, label) {
    await target.selectOption({ label });
    await this.waitForPageReady();
  }

  async expectText(expectedText) {
    await expect(this.page.locator('body')).toContainText(expectedText, { timeout: 15_000 });
  }

  async waitForPageReady() {
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
  }
}

module.exports = {
  BasePage
};
