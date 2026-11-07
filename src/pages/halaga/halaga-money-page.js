const { expect } = require('@playwright/test');
const { BasePage } = require('../base-page');
const { halagaLocators } = require('../locators/halaga.locators');

const TYPES = {
  expense: 'EXPENSE',
  income: 'INCOME',
  'debt payment': 'DEBT_PAYMENT',
  interest: 'DEBT_CHARGE',
  transfer: 'TRANSFER'
};

/** Recording money in Halaga: the Add form, Home totals, the Checklist and Flows → Debts. */
class HalagaMoneyPage extends BasePage {
  constructor(page) {
    super(page);
    this.locators = halagaLocators(page);
  }

  async openAddForm() {
    await this.click(this.locators.nav.plus);
    await this.click(this.locators.plusSheet.typeItIn);
    await expect(this.locators.view('add')).toBeVisible();
  }

  /** entry: { type, amount, category?, account?, to?, note? } */
  async fillTransaction(entry) {
    const add = this.locators.add;
    const type = TYPES[String(entry.type || 'expense').toLowerCase()];
    if (!type) {
      throw new Error(`Unknown Halaga transaction type: ${entry.type}`);
    }

    await this.click(add.typeTab(type));
    await this.fill(add.amount, entry.amount);
    if (entry.category) {
      await this.click(add.categoryPicker);
      await this.click(add.categoryTile(entry.category));
    }
    // option values are account names; labels add the balance, e.g. "Cash (₱0.00)"
    if (entry.account) {
      await add.account.selectOption(entry.account);
    }
    if (entry.to) {
      await add.transferTo.selectOption(entry.to);
    }
    if (entry.note) {
      await this.fill(add.note, entry.note);
    }
  }

  async save() {
    await this.click(this.locators.add.save);
  }

  async expectSaved(messagePart) {
    const done = this.locators.doneSheet;
    // "Logged successfully" for transactions, "Saved" for debts, accounts and plans
    await expect(done.title).toHaveText(/^(Logged successfully|Saved)$/, { timeout: 15_000 });
    if (messagePart) {
      await expect(done.message).toContainText(messagePart);
    }
  }

  async goHomeFromDoneSheet() {
    await this.click(this.locators.doneSheet.goHome);
    await expect(this.locators.view('home')).toBeVisible();
  }

  /** Closes the "Logged" sheet by tapping outside it, staying on the current screen. */
  async closeDoneSheet() {
    await this.locators.doneSheet.sheet.click({ position: { x: 20, y: 20 } });
    await expect(this.locators.doneSheet.sheet).toBeHidden();
  }

  async expectFormError(text) {
    await expect(this.locators.add.error).toContainText(text, { timeout: 15_000 });
  }

  async expectHomeTile(title, value) {
    await expect(this.locators.home.tile(title)).toContainText(value, { timeout: 15_000 });
  }

  async expectTransactionListed(text) {
    await expect(this.locators.home.transactions).toContainText(text, { timeout: 15_000 });
  }

  async addTodo(label) {
    const c = this.locators.checklist;
    await this.fill(c.todoInput, label);
    await this.click(c.todoAdd);
  }

  async expectTodo(label) {
    await expect(this.locators.checklist.todos).toContainText(label, { timeout: 15_000 });
  }

  async openFlowsSection(view) {
    await this.click(this.locators.flows.card(view));
    await expect(this.locators.view(view)).toBeVisible();
  }

  /** debt: { name, start, amount, rate, months } */
  async addDebt(debt) {
    const f = this.locators.flows;
    await this.click(f.addDebt);
    // the kind fills in its usual rate and term, so pick it before typing those
    if (debt.kind) {
      await f.debtType.selectOption({ label: debt.kind });
    }
    await this.fill(f.debtName, debt.name);
    await f.debtStart.fill(debt.start);
    await this.fill(f.debtAmount, debt.amount);
    await this.fill(f.debtRate, debt.rate);
    await this.fill(f.debtMonths, debt.months ?? '0');
    await this.click(f.debtSave);
  }

  /** Debts are listed as one card per kind; this checks the kind's card and its count. */
  async expectDebtGroup(kind, countText) {
    const card = this.locators.flows.debtList.locator('> *').filter({ hasText: kind }).first();
    await expect(card).toContainText(countText, { timeout: 15_000 });
  }
}

module.exports = {
  HalagaMoneyPage
};
