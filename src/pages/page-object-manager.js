const { BasePage } = require('./base-page');
const { LoginPage } = require('./login-page');
const { DemoToursPage } = require('./demo-tours-page');
const { HalagaAppPage } = require('./halaga/halaga-app-page');
const { HalagaMoneyPage } = require('./halaga/halaga-money-page');

class PageObjectManager {
  constructor(page) {
    this.page = page;
    this.instances = {};
  }

  get basePage() {
    return this.get('basePage', () => new BasePage(this.page));
  }

  get loginPage() {
    return this.get('loginPage', () => new LoginPage(this.page));
  }

  get demoToursPage() {
    return this.get('demoToursPage', () => new DemoToursPage(this.page));
  }

  get halagaApp() {
    return this.get('halagaApp', () => new HalagaAppPage(this.page));
  }

  get halagaMoney() {
    return this.get('halagaMoney', () => new HalagaMoneyPage(this.page));
  }

  get(name, factory) {
    if (!this.instances[name]) {
      this.instances[name] = factory();
    }

    return this.instances[name];
  }
}

module.exports = {
  PageObjectManager
};
