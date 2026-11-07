const { BasePage } = require('./base-page');
const { config } = require('../framework/config/config-manager');
const { demoToursLocators } = require('./locators/demo-tours.locators');

class DemoToursPage extends BasePage {
  constructor(page) {
    super(page);
    this.locators = demoToursLocators(page);
  }

  async open() {
    await this.goto(config.get('app.demotours.url'));
  }

  async openRegister() {
    await this.click(this.locators.registerLink);
  }

  async registerUser(user) {
    await this.fill(this.locators.firstNameInput, user.firstName);
    await this.fill(this.locators.lastNameInput, user.lastName);
    await this.fill(this.locators.phoneInput, user.phone);
    await this.fill(this.locators.emailInput, user.email);
    await this.fill(this.locators.addressInput, user.address);
    await this.fill(this.locators.cityInput, user.city);
    await this.fill(this.locators.stateInput, user.state);
    await this.fill(this.locators.postalCodeInput, user.postalCode);
    await this.selectByLabel(this.locators.countrySelect, user.country);
    await this.fill(this.locators.usernameInput, user.username);
    await this.fill(this.locators.passwordInput, user.password);
    await this.fill(this.locators.confirmPasswordInput, user.password);
    await this.click(this.locators.submitButton);
  }

  async signIn(username, password) {
    await this.click(this.locators.signInLink);
    await this.fill(this.locators.usernameInput, username);
    await this.fill(this.locators.passwordInput, password);
    await this.click(this.locators.submitButton);
  }
}

module.exports = {
  DemoToursPage
};
