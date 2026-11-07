/** Locators for the Halaga app (the web bundle inside the iOS app's WKWebView). */
function halagaLocators(page) {
  return {
    intro: page.locator('#intro'),
    visibleView: page.locator('section.view:not([hidden])'),
    view: (name) => page.locator(`#v-${name}`),
    header: (name) => page.locator(`#v-${name} header h1`),

    welcome: {
      startEmpty: page.locator('#w-empty'),
      cloudSummary: page.locator('#w-cloud summary'),
      cloudConfig: page.locator('#w-config'),
      cloudEmail: page.locator('#w-email'),
      cloudPassword: page.locator('#w-password'),
      cloudConnect: page.locator('#w-connect'),
      cloudError: page.locator('#w-cloud .error')
    },

    nav: {
      bar: page.locator('#nav'),
      tab: (view) => page.locator(`#nav button[data-view="${view}"]`),
      plus: page.locator('#nav button[data-plus]')
    },

    home: {
      tile: (title) => page.locator('#cards > *').filter({ hasText: title }).first(),
      transactions: page.locator('#transactions'),
      goTo: (view) => page.locator(`#v-home [data-go="${view}"]`).first()
    },

    plusSheet: {
      typeItIn: page.locator('#plusSheet [data-plus-opt="type"]')
    },

    add: {
      typeTab: (type) => page.locator(`#tabs button[data-type="${type}"]`),
      amount: page.locator('#amount'),
      categoryPicker: page.locator('#catPick'),
      categoryTile: (name) => page.locator(`#catSheet .cat-tile[data-cat="${name}"]`),
      account: page.locator('#account'),
      transferTo: page.locator('#transferTo'),
      date: page.locator('#date'),
      note: page.locator('#note'),
      save: page.locator('#form button[type="submit"]'),
      error: page.locator('#error')
    },

    doneSheet: {
      sheet: page.locator('#doneSheet'),
      title: page.locator('#doneTitle'),
      message: page.locator('#doneMsg'),
      goHome: page.locator('#doneHome')
    },

    checklist: {
      todoInput: page.locator('#todoLabel'),
      todoAdd: page.locator('#todoForm button[type="submit"]'),
      todos: page.locator('#todos')
    },

    flows: {
      card: (view) => page.locator(`#v-debts .card.go[data-open="view:${view}"]`),
      debtsSummary: page.locator('#sum-debts'),
      addDebt: page.locator('#v-debtlist [data-add="debt"]'),
      debtType: page.locator('#dType'),
      debtName: page.locator('#dName'),
      debtStart: page.locator('#dStart'),
      debtAmount: page.locator('#dAmount'),
      debtRate: page.locator('#dRate'),
      debtMonths: page.locator('#dMonths'),
      debtSave: page.locator('#debtForm button[type="submit"]'),
      debtError: page.locator('#dError'),
      debtList: page.locator('#debts')
    },

    settings: {
      hideAmounts: page.locator('#hideOn'),
      cloudConfig: page.locator('#c-config'),
      done: page.locator('#moreDone')
    }
  };
}

module.exports = {
  halagaLocators
};
