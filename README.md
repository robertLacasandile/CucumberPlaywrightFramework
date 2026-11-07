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
  pom-login.feature                 Traditional POM login example
  pom-api-database-examples.feature Ignored API and DB starter examples

src/framework/
  api/                              Playwright APIRequestContext wrapper
  config/                           Property-file loader
  core/                             Browser factory, hooks, world, smart actions
  core/smart-locators.js            Scored locator strategies and self-healing recommendations
  database/                         Optional PostgreSQL/MySQL database manager
  grid/                             Playwright remote server lifecycle
  logging/                          Clean framework logging
  reporting/                        Report opener helper
  utils/                            Paths and sensitive data masking

src/pages/
  base-page.js                      Shared Playwright page helpers
  locators/                         Traditional selector definitions
  login-page.js                     Traditional locator-backed login page object
  demo-tours-page.js                Example page object for Demo Tours
  page-object-manager.js            Lazy page object registry exposed as this.pages

src/step-definitions/
  action.steps.js                   Click, type, select, check, key steps
  api.steps.js                      API request and response assertions
  database.steps.js                 Database query assertions
  login.steps.js                    URL-opening steps
  pom.steps.js                      Traditional POM-oriented Cucumber steps
  context-aware.steps.js            Context text and selector steps

target/
  reports/                          Cucumber HTML and JSON reports
  screenshots/                      Failure screenshots
  videos/                           Optional Playwright videos

.github/workflows/
  ci.yml                            Pull request and push validation pipeline
  regression.yml                    Scheduled/manual full regression pipeline
  cd.yml                            Release/manual packaging readiness pipeline
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

api.base.url=http://localhost:3000
api.headers=

db.type=none
db.host=localhost
db.port=5432
db.name=
db.username=
db.password=
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

Run traditional page object scenarios:

```bash
npm run test:pom
```

Run API or database scenarios:

```bash
npm run test:api
npm run test:database
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

## CI/CD Readiness

GitHub Actions workflow files are available under:

```text
.github/workflows/
```

`ci.yml` runs on pull requests and pushes to `main`, `master`, and `develop`. It installs dependencies, checks JavaScript syntax, validates Cucumber bindings, installs Chromium, then runs the smart-locator and POM smoke tests.

`regression.yml` runs on weekdays by schedule and can also be started manually with a custom Cucumber tag expression.

`cd.yml` is a deployment-readiness placeholder. It validates the framework and uploads a packaged test asset bundle for release/manual runs. Add deployment steps there once there is a real target environment.

The pipelines upload Cucumber, screenshot, video, and Allure outputs as workflow artifacts when available.

## Tags

Use `@ui`, `@pom`, or `@selenium-run` for browser scenarios. The `@selenium-run` tag is preserved from the Java framework so existing feature files do not need to change immediately.

```gherkin
@selenium-run
Feature: Smart action based locator resolution
```

Use `@api` for API scenarios and `@database` for database scenarios. These tags initialize only the needed clients, so API and DB checks do not launch a browser unless you also add `@ui` or `@pom`.

## Traditional POM Model

The framework now supports a conventional Playwright Page Object Model beside the smart locator steps:

```text
src/pages/base-page.js
src/pages/locators/login.locators.js
src/pages/login-page.js
src/pages/demo-tours-page.js
src/pages/page-object-manager.js
```

Browser scenarios get page objects through the Cucumber World:

```javascript
this.pages.loginPage
this.pages.demoToursPage
this.pages.basePage
```

Example:

```gherkin
@ui @pom
Scenario: Login using traditional page object model
  Given I open the login page using POM for "app.herokuapp.url"
  When I login using POM with config username "app.heroku.username" and config password "app.heroku.password"
  Then I should see text using POM "You logged into a secure area!"
```

Add new screens by creating a page class under `src/pages/` and registering it in `src/pages/page-object-manager.js`.

## API Readiness

API scenarios use Playwright's `APIRequestContext` through:

```text
src/framework/api/api-client.js
```

Configure the API target in `config/global.properties`:

```properties
api.base.url=http://localhost:3000
api.headers=Authorization: Bearer token, X-Test: true
```

Example:

```gherkin
@api
Scenario: API health check
  Given the API client is ready
  When I send a GET request to "/health"
  Then the API response status should be 200
```

## Database Readiness

Database scenarios use:

```text
src/framework/database/database-manager.js
```

Set `db.type=postgres` or `db.type=mysql` and install the matching driver only when needed:

```bash
npm install pg
npm install mysql2
```

Example:

```gherkin
@database
Scenario: Database query check
  When I run the database query
    """
    select 1 as status
    """
  Then the database result should have 1 row
  And the first database row column "status" should be "1"
```

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

## Halaga iOS app

Halaga (`~/debt-planner`, Xcode project `ios/MoneyTracker.xcodeproj`) shows a web bundle in a
WKWebView, so its screens are tested here with Playwright WebKit and iPhone emulation:

```bash
npm run test:halaga          # headless or headed per execution.headless
npm run test:halaga:headed
```

- `app.halaga.dir` points at the bundle (`src/main/resources/ph/debtplanner/mobile`); the hooks serve it
  on `127.0.0.1` with a random port for each worker. Other hosts are blocked, so tests never reach cloud
  sync, Google Fonts or Claude.
- `app.halaga.mode=native` (the default) installs a stub of the iOS bridge
  (`src/framework/halaga/native-bridge-stub.js`), so the page runs as it does inside the app (native-only
  screens, the Add sheet, data in the bridge store). `web` runs the plain browser build.
- Each scenario is a fresh install with empty storage, and all data is test data typed in by the steps.
- Not covered (needs the real device or simulator): Face ID unlock, camera/photo receipt scanning, the
  share sheet, notifications, alternate icons, Claude.
- Pages: `src/pages/halaga/`, locators: `src/pages/locators/halaga.locators.js`,
  steps: `src/step-definitions/halaga.steps.js`, features: `features/halaga-*.feature`.

### GitHub issues from test runs

`npm run test:halaga:issues` runs the Halaga scenarios, then syncs issues in
`robertLacasandile/HalagaApplication` (`github.issues.*` in `config/global.properties`):

- a failing scenario opens an issue (labels `automated-test`, `bug`) with the failed step, error and tested app
  commit, or comments on its open issue, or reopens its closed one;
- a passing scenario with an open issue gets a "Passing now" comment and the issue is closed.

Each issue holds a hidden `test-key` so later runs find it. Link commits by putting the issue number in the
commit message (`Refs #12`); GitHub lists them on the issue. `npm run issues:sync:dry` shows what would change
without touching GitHub. CI: `.github/workflows/halaga.yml` (needs the `HALAGA_REPO_TOKEN` secret).
