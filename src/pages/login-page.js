const { BasePage } = require('./base-page');
const { config } = require('../framework/config/config-manager');
const { loginLocators } = require('./locators/login.locators');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.locators = loginLocators(page);
  }

  async open(urlKeyOrUrl) {
    await this.goto(resolveUrl(urlKeyOrUrl));
  }

  async login(username, password) {
    await this.fill(this.locators.usernameInput, username);
    await this.fill(this.locators.passwordInput, password);
    await this.click(this.locators.loginButton);
  }

  async loginWithConfig(usernameKey, passwordKey) {
    const username = config.get(usernameKey);
    const password = config.get(passwordKey);

    if (username === undefined) {
      throw new Error(`No config value found for key: ${usernameKey}`);
    }
    if (password === undefined) {
      throw new Error(`No config value found for key: ${passwordKey}`);
    }

    await this.login(username, password);
  }

  async loginWithEmail(email, password) {
    await this.fill(this.locators.emailInput, email);
    await this.fill(this.locators.passwordInput, password);
    await this.click(this.locators.loginButton);
  }

  async expectFlashMessage(text) {
    await this.locators.flashMessage.waitFor({ state: 'visible', timeout: 15_000 });
    await this.expectText(text);
  }
}

function resolveUrl(urlKeyOrUrl) {
  if (/^https?:\/\//i.test(urlKeyOrUrl)) {
    return urlKeyOrUrl;
  }

  const url = config.get(urlKeyOrUrl);
  if (!url) {
    throw new Error(`No URL found in config for key: ${urlKeyOrUrl}`);
  }

  return url;
}

module.exports = {
  LoginPage
};
