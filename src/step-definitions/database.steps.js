const { Then, When } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

When('I run the database query', async function (docString) {
  this.dbRows = await this.db.query(docString);
});

Then('the database result should have {int} row(s)', async function (expectedRows) {
  expect(this.dbRows).toHaveLength(expectedRows);
});

Then('the first database row column {string} should be {string}', async function (columnName, expectedValue) {
  expect(String(this.dbRows[0]?.[columnName])).toBe(expectedValue);
});
