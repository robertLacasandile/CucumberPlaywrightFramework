const { Given, Then, When } = require('@cucumber/cucumber');
const { config } = require('../framework/config/config-manager');

Given('I open the login page using POM for {string}', async function (urlKeyOrUrl) {
  await this.pages.loginPage.open(urlKeyOrUrl);
});

When('I login using POM with username {string} and password {string}', async function (username, password) {
  await this.pages.loginPage.login(username, password);
});

When('I login using POM with config username {string} and config password {string}', async function (usernameKey, passwordKey) {
  await this.pages.loginPage.loginWithConfig(usernameKey, passwordKey);
});

When('I login using POM with email {string} and config password {string}', async function (email, passwordKey) {
  const password = config.get(passwordKey);
  if (password === undefined) {
    throw new Error(`No config value found for key: ${passwordKey}`);
  }

  await this.pages.loginPage.loginWithEmail(email, password);
});

Then('I should see text using POM {string}', async function (expectedText) {
  await this.pages.basePage.expectText(expectedText);
});

Given('I open Demo Tours using POM', async function () {
  await this.pages.demoToursPage.open();
});

When('I register a Demo Tours user using POM', async function (dataTable) {
  const user = dataTable.rowsHash();
  await this.pages.demoToursPage.openRegister();
  await this.pages.demoToursPage.registerUser({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    address: user.address,
    city: user.city,
    state: user.state,
    postalCode: user.postalCode,
    country: user.country,
    username: user.username,
    password: user.passwordKey ? config.get(user.passwordKey) : user.password
  });
});
