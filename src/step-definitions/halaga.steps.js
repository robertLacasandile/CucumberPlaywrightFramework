const { Given, When, Then } = require('@cucumber/cucumber');

// Screen names as the user sees them → the app's view ids (Flows is still `debts` in code).
const TABS = { Home: 'home', Checklist: 'check', Flows: 'debts', Insights: 'insights' };
const HOME_BUTTONS = { Settings: 'more', Accounts: 'accounts', Budgets: 'budgets' };
const FLOW_SECTIONS = { Income: 'income', 'Monthly bills': 'bills', Debts: 'debtlist' };
const VIEWS = { Welcome: 'welcome', Add: 'add', ...TABS, ...HOME_BUTTONS, ...FLOW_SECTIONS };

function viewId(name) {
  const id = VIEWS[name];
  if (!id) {
    throw new Error(`Unknown Halaga screen "${name}". Known: ${Object.keys(VIEWS).join(', ')}`);
  }
  return id;
}

Given('I launch Halaga as a fresh install', async function () {
  await this.pages.halagaApp.launch(this.halagaUrl);
});

Given('I start Halaga with no data', async function () {
  await this.pages.halagaApp.launch(this.halagaUrl);
  await this.pages.halagaApp.startWithNothing();
});

When('I choose to start with nothing', async function () {
  await this.pages.halagaApp.startWithNothing();
});

When('I open the {string} tab', async function (name) {
  const id = TABS[name];
  if (!id) {
    throw new Error(`Unknown tab "${name}". Known: ${Object.keys(TABS).join(', ')}`);
  }
  await this.pages.halagaApp.openTab(id);
});

When('I open {string} from Home', async function (name) {
  const id = HOME_BUTTONS[name];
  if (!id) {
    throw new Error(`Unknown Home button "${name}". Known: ${Object.keys(HOME_BUTTONS).join(', ')}`);
  }
  await this.pages.halagaApp.openFromHome(id);
});

When('I open the {string} section in Flows', async function (name) {
  await this.pages.halagaMoney.openFlowsSection(viewId(name));
});

Then('I should be on the Halaga {string} screen', async function (name) {
  await this.pages.halagaApp.expectView(viewId(name));
});

Then('the {string} screen title should be {string}', async function (name, title) {
  await this.pages.halagaApp.expectHeader(viewId(name), title);
});

Then('the Halaga tab bar should be {word}', async function (state) {
  await this.pages.halagaApp.expectTabBarVisible(state === 'visible');
});

Then('the Home tile {string} should show {string}', async function (title, value) {
  await this.pages.halagaMoney.expectHomeTile(title, value);
});

When('I record a Halaga transaction', async function (dataTable) {
  const money = this.pages.halagaMoney;
  await money.openAddForm();
  await money.fillTransaction(dataTable.rowsHash());
  await money.save();
});

When('I fill a Halaga transaction without saving', async function (dataTable) {
  const money = this.pages.halagaMoney;
  await money.openAddForm();
  await money.fillTransaction(dataTable.rowsHash());
});

When('I save the transaction', async function () {
  await this.pages.halagaMoney.save();
});

Then('Halaga should confirm it was logged', async function () {
  await this.pages.halagaMoney.expectSaved();
});

Then(/^Halaga should confirm it was (?:logged|saved) with "([^"]*)"$/, async function (message) {
  await this.pages.halagaMoney.expectSaved(message);
});

When('I go back to the main menu', async function () {
  await this.pages.halagaMoney.goHomeFromDoneSheet();
});

When('I close the confirmation', async function () {
  await this.pages.halagaMoney.closeDoneSheet();
});

Then('the Add form should show the error {string}', async function (message) {
  await this.pages.halagaMoney.expectFormError(message);
});

Then('the Home transactions should list {string}', async function (text) {
  await this.pages.halagaMoney.expectTransactionListed(text);
});

When('I add the to-do {string}', async function (label) {
  await this.pages.halagaMoney.addTodo(label);
});

Then('my to-dos should include {string}', async function (label) {
  await this.pages.halagaMoney.expectTodo(label);
});

When('I add a Halaga debt', async function (dataTable) {
  await this.pages.halagaMoney.addDebt(dataTable.rowsHash());
});

Then('the Debts page should show {string} with {string}', async function (kind, countText) {
  await this.pages.halagaMoney.expectDebtGroup(kind, countText);
});

When('I try to sign in to cloud sync with', async function (dataTable) {
  await this.pages.halagaApp.signInToCloudFromWelcome(dataTable.rowsHash());
});

Then('cloud sync should show the error {string}', async function (message) {
  await this.pages.halagaApp.expectCloudError(message);
});

When('I turn {word} "Hide amounts" in Settings', async function (state) {
  await this.pages.halagaApp.setHideAmounts(state === 'on');
});

When('I close Settings', async function () {
  await this.pages.halagaApp.closeSettings();
});
