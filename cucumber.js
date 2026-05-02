module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'src/framework/core/world.js',
      'src/framework/core/hooks.js',
      'src/step-definitions/**/*.js'
    ],
    format: [
      'progress',
      'html:target/reports/cucumber-report.html',
      'json:target/reports/cucumber-report.json',
      'allure-cucumberjs/reporter'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    tags: 'not @ignore'
  }
};
