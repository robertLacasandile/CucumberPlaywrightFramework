const { setWorldConstructor, World } = require('@cucumber/cucumber');
const { SmartActions } = require('./smart-actions');

class FrameworkWorld extends World {
  constructor(options) {
    super(options);
    this.browser = null;
    this.context = null;
    this.page = null;
    this.smartActions = null;
  }

  setPage(page) {
    this.page = page;
    this.smartActions = new SmartActions(page);
  }
}

setWorldConstructor(FrameworkWorld);
