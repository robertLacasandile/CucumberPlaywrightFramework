const { Given, Then, When } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('the API client is ready', async function () {
  if (!this.api) {
    throw new Error('API client is not initialized. Add @api to the scenario.');
  }
});

When('I send a GET request to {string}', async function (path) {
  this.apiResponse = await this.api.get(path);
});

When('I send a POST request to {string} with JSON body', async function (path, docString) {
  this.apiResponse = await this.api.post(path, {
    data: JSON.parse(docString)
  });
});

Then('the API response status should be {int}', async function (statusCode) {
  expect(this.apiResponse.status()).toBe(statusCode);
});

Then('the API response body should contain {string}', async function (expectedText) {
  expect(await this.apiResponse.text()).toContain(expectedText);
});
