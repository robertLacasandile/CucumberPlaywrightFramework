const { expect } = require('@playwright/test');
const { BasePage } = require('../base-page');
const { halagaLocators } = require('../locators/halaga.locators');

/** App-wide actions for Halaga: launch, the welcome screen, the tab bar and the screens it opens. */
class HalagaAppPage extends BasePage {
  constructor(page) {
    super(page);
    this.locators = halagaLocators(page);
  }

  async launch(url) {
    await this.goto(url);
    await this.skipIntro();
  }

  /** The intro animation covers the app for about 2 seconds; a tap skips it. */
  async skipIntro() {
    const intro = this.locators.intro;
    if (await intro.isVisible().catch(() => false)) {
      await intro.click({ force: true }).catch(() => {});
    }
    await expect(intro).toBeHidden({ timeout: 10_000 });
  }

  async startWithNothing() {
    await this.click(this.locators.welcome.startEmpty);
    await this.expectView('home');
  }

  async openTab(view) {
    await this.click(this.locators.nav.tab(view));
    await this.expectView(view);
  }

  async openFromHome(view) {
    await this.click(this.locators.home.goTo(view));
    await this.expectView(view);
  }

  async expectView(name) {
    await expect(this.locators.view(name)).toBeVisible({ timeout: 15_000 });
  }

  async expectHeader(name, text) {
    await expect(this.locators.header(name)).toHaveText(text, { timeout: 15_000 });
  }

  async expectTabBarVisible(visible = true) {
    const bar = this.locators.nav.bar;
    if (visible) {
      await expect(bar).toBeVisible();
    } else {
      await expect(bar).toBeHidden();
    }
  }

  async signInToCloudFromWelcome({ config = '', email = '', password = '' }) {
    const w = this.locators.welcome;
    await this.click(w.cloudSummary);
    await this.fill(w.cloudConfig, config);
    await this.fill(w.cloudEmail, email);
    await this.fill(w.cloudPassword, password);
    await this.click(w.cloudConnect);
  }

  async expectCloudError(text) {
    await expect(this.locators.welcome.cloudError.filter({ hasText: text })).toBeVisible({ timeout: 15_000 });
  }

  async setHideAmounts(on) {
    const box = this.locators.settings.hideAmounts;
    if ((await box.isChecked()) !== on) {
      // the checkbox is styled as a switch; clicking its label toggles it
      await this.click(box.locator('xpath=ancestor::label[1]'));
    }
    await expect(box).toBeChecked({ checked: on });
  }

  async closeSettings() {
    await this.click(this.locators.settings.done);
  }
}

module.exports = {
  HalagaAppPage
};
