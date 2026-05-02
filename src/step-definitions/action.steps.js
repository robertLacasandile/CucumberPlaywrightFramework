const { When } = require('@cucumber/cucumber');
const { config } = require('../framework/config/config-manager');

When('I click {string}', async function (referenceText) {
  await this.smartActions.click(referenceText);
});

When('I type {string} into {string}', async function (value, referenceText) {
  await this.smartActions.type(referenceText, value);
});

When('I type config {string} into {string}', async function (configKey, referenceText) {
  const value = config.get(configKey);
  if (value === undefined) {
    throw new Error(`No config value found for key: ${configKey}`);
  }

  await this.smartActions.type(referenceText, value);
});

When('I clear {string}', async function (referenceText) {
  await this.smartActions.clear(referenceText);
});

When('I select {string} from {string}', async function (visibleText, referenceText) {
  await this.smartActions.select(referenceText, visibleText);
});

When('I select {string} from grouped dropdown {string} at position {int}', async function (visibleText, referenceText, position) {
  await this.smartActions.selectGroupedDropdown(referenceText, position, visibleText);
});

When('I check {string}', async function (referenceText) {
  await this.smartActions.check(referenceText);
});

When('I press {string} on {string}', async function (key, referenceText) {
  await this.smartActions.pressKey(referenceText, key);
});
