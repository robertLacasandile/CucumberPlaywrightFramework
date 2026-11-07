const { config } = require('../config/config-manager');

class DatabaseManager {
  constructor() {
    this.client = null;
    this.type = config.get('db.type', 'none').toLowerCase();
  }

  async connect() {
    if (this.type === 'none') {
      return;
    }

    if (this.type === 'postgres' || this.type === 'postgresql') {
      const { Client } = requireOptional('pg', 'PostgreSQL support requires: npm install pg');
      this.client = new Client({
        host: config.get('db.host', 'localhost'),
        port: config.getNumber('db.port', 5432),
        database: config.get('db.name'),
        user: config.get('db.username'),
        password: config.get('db.password')
      });
      await this.client.connect();
      return;
    }

    if (this.type === 'mysql') {
      const mysql = requireOptional('mysql2/promise', 'MySQL support requires: npm install mysql2');
      this.client = await mysql.createConnection({
        host: config.get('db.host', 'localhost'),
        port: config.getNumber('db.port', 3306),
        database: config.get('db.name'),
        user: config.get('db.username'),
        password: config.get('db.password')
      });
      return;
    }

    throw new Error(`Unsupported db.type "${this.type}". Supported values: none, postgres, mysql`);
  }

  async query(sql, params = []) {
    if (!this.client) {
      throw new Error('Database client is not connected. Add @database to the scenario or call db.connect().');
    }

    if (this.type === 'mysql') {
      const [rows] = await this.client.execute(sql, params);
      return rows;
    }

    const result = await this.client.query(sql, params);
    return result.rows;
  }

  async disconnect() {
    if (!this.client) {
      return;
    }

    if (this.type === 'mysql') {
      await this.client.end();
    } else {
      await this.client.end();
    }

    this.client = null;
  }
}

function requireOptional(packageName, installHint) {
  try {
    return require(packageName);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error(installHint);
    }

    throw error;
  }
}

module.exports = {
  DatabaseManager
};
