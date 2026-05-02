const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG_PATH = path.resolve(process.cwd(), 'config/global.properties');

function parseProperties(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((values, line) => {
      const separator = line.indexOf('=');
      if (separator === -1) {
        return values;
      }

      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      values[key] = value;
      return values;
    }, {});
}

class ConfigManager {
  constructor(configPath = DEFAULT_CONFIG_PATH) {
    this.configPath = configPath;
    this.values = {};
    this.load();
  }

  load() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Config file not found: ${this.configPath}`);
    }

    this.values = parseProperties(fs.readFileSync(this.configPath, 'utf8'));
  }

  get(key, defaultValue = undefined) {
    const environmentKey = key.toUpperCase().replaceAll('.', '_');
    const systemValue = process.env[environmentKey] ?? process.env[key];
    if (systemValue !== undefined && systemValue !== '') {
      return systemValue;
    }

    return this.values[key] ?? defaultValue;
  }

  getBoolean(key, defaultValue = false) {
    const value = this.get(key, String(defaultValue));
    return String(value).toLowerCase() === 'true';
  }

  getNumber(key, defaultValue) {
    const value = Number(this.get(key, defaultValue));
    return Number.isFinite(value) ? value : defaultValue;
  }
}

module.exports = {
  ConfigManager,
  config: new ConfigManager()
};
