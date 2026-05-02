const { Then, When } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Then('I should see text in current context {string}', async function (expectedText) {
  await this.smartActions.expectText(expectedText);
});

Then('I should see text {string}', async function (expectedText) {
  await this.smartActions.expectText(expectedText);
});

When('I click in current context by css {string}', async function (css) {
  await this.page.locator(css).click();
});

When('I click in current context by xpath {string}', async function (xpath) {
  await this.page.locator(`xpath=${xpath}`).click();
});

When('I type {string} in current context by css {string}', async function (value, css) {
  await this.page.locator(css).fill(value);
});

When('I type {string} in current context by xpath {string}', async function (value, xpath) {
  await this.page.locator(`xpath=${xpath}`).fill(value);
});

When('I press ENTER in current context by css {string}', async function (css) {
  await this.page.locator(css).press('Enter');
});

When('I select {string} in current context by css {string}', async function (visibleText, css) {
  await this.page.locator(css).selectOption({ label: visibleText });
});

Then('I should see element in current context by css {string}', async function (css) {
  await expect(this.page.locator(css)).toBeVisible();
});
