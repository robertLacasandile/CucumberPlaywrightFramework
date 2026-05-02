const { protectText } = require('../utils/sensitive-data-protector');

function timestamp() {
  return new Date().toISOString().slice(11, 19);
}

class FrameworkLogger {
  constructor(scope) {
    this.scope = scope;
  }

  phase(phase, message, ...args) {
    this.write(phase, message, ...args);
  }

  success(phase, message, ...args) {
    this.write(phase, `SUCCESS - ${message}`, ...args);
  }

  warn(phase, message, ...args) {
    this.write(phase, `WARN - ${message}`, ...args);
  }

  error(phase, message, error) {
    const suffix = error ? ` ${error.stack || error.message || error}` : '';
    this.write(phase, `ERROR - ${message}${suffix}`);
  }

  detail(phase, message, ...args) {
    if (process.env.LOG_LEVEL === 'debug') {
      this.write(phase, message, ...args);
    }
  }

  write(phase, message, ...args) {
    const formatted = args.reduce((text, arg) => text.replace('{}', String(arg)), message);
    console.log(`${timestamp()} [${phase}] ${protectText(formatted)}`);
  }
}

module.exports = {
  getLogger(scope) {
    return new FrameworkLogger(scope);
  }
};
