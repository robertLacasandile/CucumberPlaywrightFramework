const { request } = require('@playwright/test');
const { config } = require('../config/config-manager');

class ApiClient {
  constructor(requestContext, baseUrl) {
    this.request = requestContext;
    this.baseUrl = baseUrl;
  }

  async get(path, options = {}) {
    return this.request.get(this.url(path), options);
  }

  async post(path, options = {}) {
    return this.request.post(this.url(path), options);
  }

  async put(path, options = {}) {
    return this.request.put(this.url(path), options);
  }

  async patch(path, options = {}) {
    return this.request.patch(this.url(path), options);
  }

  async delete(path, options = {}) {
    return this.request.delete(this.url(path), options);
  }

  url(path) {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const base = this.baseUrl.replace(/\/+$/, '');
    const route = String(path).replace(/^\/+/, '');
    return `${base}/${route}`;
  }

  async dispose() {
    await this.request.dispose();
  }

  static async create() {
    const baseUrl = config.get('api.base.url', 'http://localhost:3000');
    const extraHTTPHeaders = parseHeaders(config.get('api.headers', ''));
    const requestContext = await request.newContext({
      baseURL: baseUrl,
      extraHTTPHeaders,
      ignoreHTTPSErrors: true
    });

    return new ApiClient(requestContext, baseUrl);
  }
}

function parseHeaders(value) {
  if (!value) {
    return {};
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((headers, entry) => {
      const separator = entry.indexOf(':');
      if (separator === -1) {
        return headers;
      }

      const name = entry.slice(0, separator).trim();
      const headerValue = entry.slice(separator + 1).trim();
      headers[name] = headerValue;
      return headers;
    }, {});
}

module.exports = {
  ApiClient
};
