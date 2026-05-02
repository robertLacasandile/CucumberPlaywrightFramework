const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  reporter: [['html', { outputFolder: 'target/playwright-report', open: 'never' }]]
});
