const { setWorldConstructor, World } = require('@cucumber/cucumber');
const { SmartActions } = require('./smart-actions');
const { PageObjectManager } = require('../../pages/page-object-manager');
const { DatabaseManager } = require('../database/database-manager');

class FrameworkWorld extends World {
  constructor(options) {
    super(options);
    this.browser = null;
    this.context = null;
    this.page = null;
    this.smartActions = null;
    this.pages = null;
    this.api = null;
    this.db = new DatabaseManager();
  }

  setPage(page) {
    this.page = page;
    this.smartActions = new SmartActions(page);
    this.pages = new PageObjectManager(page);
  }
}

setWorldConstructor(FrameworkWorld);
