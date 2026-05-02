# Cucumber Playwright Node.js Automation Framework

Node.js automation framework using Cucumber.js and Playwright. This branch replaces the Java/Selenium execution path with a Playwright-first implementation while keeping the same Gherkin style and configuration-driven execution model.

## Tech Stack

- Node.js
- Cucumber.js
- Playwright
- Built-in Cucumber HTML and JSON reports
- Allure Report
- Docker Compose for remote Playwright server execution

## Project Structure

```text
config/
  global.properties                 Main framework configuration

features/
  demotours.feature                 Cucumber feature file

src/framework/
  config/                           Property-file loader
  core/                             Browser factory, hooks, world, smart actions
  core/smart-locators.js            Scored locator strategies and self-healing recommendations
  grid/                             Playwright remote server lifecycle
  logging/                          Clean framework logging
  reporting/                        Report opener helper
  utils/                            Paths and sensitive data masking

src/step-definitions/
  action.steps.js                   Click, type, select, check, key steps
  login.steps.js                    URL-opening steps
  context-aware.steps.js            Context text and selector steps

target/
  reports/                          Cucumber HTML and JSON reports
  screenshots/                      Failure screenshots
  videos/                           Optional Playwright videos
```

## Setup

Install Node.js, then install dependencies:

```bash
npm install
npm run install:browsers
```

## Configuration

Main configuration is here:

```text
config/global.properties
```

Important values:

```properties
execution.mode=local
execution.browser=chromium
execution.headless=false
execution.parallel.enabled=auto
execution.parallel.max=3

remote.grid.url=ws://127.0.0.1:4444/
remote.grid.auto.manage=true
remote.grid.compose.file=playwright-grid-docker-compose.yml
remote.grid.start.timeout.seconds=60
```

Supported execution modes:

- `local`: runs a local Playwright browser. `execution.headless` decides headed/headless.
- `remote-local`: runs local Playwright in headless mode.
- `remote-grid`: starts the Playwright Docker server and connects to it through `remote.grid.url`.

## Running Tests

Run with the default config:

```bash
npm test
```

Run local headed/headless based on config:

```bash
npm run test:local
```

Run local headless:

```bash
npm run test:remote-local
```

Run through the Playwright remote server:

```bash
npm run test:remote-grid
```

Open the generated Cucumber HTML report:

```bash
npm run report
```

Generate the Allure report:

```bash
npm run report:allure
```

Open the generated Allure report:

```bash
npm run report:allure:open
```

Or generate and open a temporary Allure server:

```bash
npm run report:allure:serve
```

## Tags

Use `@selenium-run` for browser scenarios. The name is preserved from the Java framework so existing feature files do not need to change immediately.

```gherkin
@selenium-run
Feature: Smart action based locator resolution
```

Future API or database tests can omit `@selenium-run` and add their own hooks later.

## Reporting

The framework generates:

```text
target/reports/cucumber-report.html
target/reports/cucumber-report.json
allure-results/
allure-report/
```

Failed browser scenarios attach screenshots and also write image files under:

```text
target/screenshots/
```

## Sensitive Data

Use config-backed steps for passwords and secrets:

```gherkin
And I type config "app.heroku.password" into "Password"
```

The logger and action layer mask password-like values before printing them.

## Playwright Remote Grid

Playwright does not connect to Selenium Grid using WebDriver sessions. For this reason, `remote-grid` uses a Playwright server container:

```text
playwright-grid-docker-compose.yml
```

When `remote.grid.auto.manage=true`, the framework runs:

```bash
docker compose -f playwright-grid-docker-compose.yml up -d
```

before the run, waits for the WebSocket port, then runs:

```bash
docker compose -f playwright-grid-docker-compose.yml down
```

after the run.

## Existing Gherkin Steps

The Node.js implementation supports the current feature wording:

```gherkin
Given I open the "app.herokuapp.url" login page
When I type "tomsmith" into "Username"
And I type config "app.heroku.password" into "Password"
And I click "Login"
Then I should see text in current context "You logged into a secure area!"
```

## Smart Locators

Smart actions are powered by:

```text
src/framework/core/smart-actions.js
src/framework/core/smart-locators.js
```

`smart-actions.js` owns browser actions such as click, type, select, and check.
`smart-locators.js` resolves the best locator for each action.

The locator engine now supports:

- scored locator strategies
- visibility-aware candidate selection
- self-healing fallback from the live DOM
- AI-style recommendations using label, text, aria-label, placeholder, id, name, value, and title signals
- recommendation logs when healing is used or locator confidence is low

Example log output:

```text
[SMART-LOCATOR] type "Username" -> label exact score=100 reason=Exact form label
[SELF-HEAL] WARN - type "Username" healed with score=71 selector=#login_user reason=label matched "User name"
[AI-RECOMMENDER] WARN - #1 type "Username" score=71 selector=#login_user reason=label matched "User name"
```

## Common Commands

```bash
npm install
npm run install:browsers
npm test
npm run test:local
npm run test:remote-local
npm run test:remote-grid
npm run report
```
