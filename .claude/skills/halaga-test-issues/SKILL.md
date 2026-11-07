---
name: halaga-test-issues
description: Run the Halaga iOS app Cucumber/Playwright tests (locally or in GitHub Actions) and sync the results to GitHub issues in robertLacasandile/HalagaApplication. A failing scenario opens or updates an issue and a passing one closes it. Before running, it finds features added to the app since the last tested commit and writes a positive and a negative test case for each. Sets up whatever is missing first (gh login, token, secret, workflow). Use when asked to test Halaga, run the Halaga suite, "log issues", "trigger the tests", cover new Halaga features, or check why the Halaga CI or issue sync failed.
---

# Halaga tests → GitHub issues

This skill runs the Halaga tests and turns the result into GitHub issues. It uses this repo (CucumberPlaywrightFramework) and the app repo `robertLacasandile/HalagaApplication`.

**How it works**
- Halaga's iOS app shows a web bundle in a WKWebView. The tests serve `app.halaga.dir`, which is `src/main/resources/ph/debtplanner/mobile` in the app, on `127.0.0.1`. They run it in Playwright WebKit with iPhone 14 Pro emulation and a stub of the native bridge. Every scenario starts as a fresh install, and requests to any other host are blocked.
- `src/framework/reporting/github-issue-sync.js` reads `target/reports/cucumber-report.json`. For each `@halaga` scenario it:
  - **fails, no issue yet:** opens an issue with the labels `automated-test` and `bug`;
  - **fails, issue open:** comments "Still failing";
  - **fails, issue closed:** reopens the issue;
  - **passes, issue open:** comments "Passing now" and closes the issue;
  - **fails in a Before/After hook:** opens no issue (it's a setup failure). If every scenario failed that way, the sync stops with an error.

  A hidden `<!-- test-key: … -->` in each issue body ties the issue to its scenario.
- Commits are linked by GitHub itself whenever a commit message names the issue, e.g. `Refs #12` or `Fixes #12`. No token is needed for that.

## Rules
- **Never handle the token value.** Don't ask for it, echo it, put it in a file or a command line, or type it into a prompt. If the user pastes one into chat, don't use it: tell them it's exposed and should be regenerated.
- **Commands that read pasted input must run in a Terminal tab**, e.g. `gh secret set` or `read -s`. The chat's `!`/bash input can't read pasted input; it stops at the prompt.
- **Issues and CI runs are outward-facing.** Run the live sync or trigger the workflow only when the user asked for it. Use `--dry-run` to preview.
- **Merging is the user's call.** Workflow and framework changes reach CI only after they're merged to `main`, because GitHub runs `workflow_dispatch` from the default branch. Open a PR and ask the user to merge it.
- **Report each run faithfully:** how many scenarios passed or failed, and which issues were opened, commented, reopened or closed, with links.

## Step 1 — Preflight

```bash
bash .claude/skills/halaga-test-issues/scripts/preflight.sh
```

Each line prints `OK`, `MISSING` or `WARN`, followed by `LOCAL MODE: ready/not ready` and `CI MODE: ready/not ready`. Every `MISSING` line names the setup step that fixes it. Do those steps (see **Setup** below), then rerun the preflight.

Pick the mode:
- **CI mode** (preferred when ready): it tests the app exactly as it is on GitHub and names the tested commit in every issue.
- **Local mode**: use it when CI isn't ready, or when the user wants to test their local `~/debt-planner` changes. It uses the user's own `gh` login. It can't name an app commit while `~/debt-planner` isn't a git checkout.

## Step 2 — New features: write positive and negative tests

Do this before every run, so new app features are tested in the same run.

```bash
bash .claude/skills/halaga-test-issues/scripts/new-features.sh        # or: … new-features.sh <branch|sha>
```

The script compares the app on GitHub against the baseline in `.claude/skills/halaga-test-issues/tested-commit.txt` and prints:
- the commits since the baseline;
- the changed files in the web bundle and in `CLAUDE.md`;
- the new `CLAUDE.md` lines (the app's feature notes, often dated);
- the screens, sheets and forms that no locator in `halaga.locators.js` touches.

**1. Decide what is new.** A feature is new when a commit, a changed bundle file or a new `CLAUDE.md` note adds or changes something a user can do. Examples: a new screen, sheet, form, button or toggle, or a new rule or validation in `logic.js`. A refactor or a pure styling change is not a feature.
- For each new feature, read the code it touches under `src/main/resources/ph/debtplanner/mobile/` (`index.html` for the UI and its handlers, `logic.js` for the rules). Get the code from the app checkout, or with `gh api repos/robertLacasandile/HalagaApplication/contents/<path>?ref=<sha> -H 'Accept: application/vnd.github.raw'`.
- Find the exact element ids, the visible success message and the error messages it shows.
- The "no test locator" lists are coverage gaps, not necessarily new features. Write tests for gaps that a new feature touches. Report the other gaps to the user and offer to cover them; don't write tests for all of them unasked.

**2. Write at least two scenarios per feature**, in `features/halaga-<area>.feature`. Use an existing file when the area fits; otherwise make a new one with `@halaga` on the Feature line.
- **Positive (`@positive`):** the happy path with valid test data. Assert the outcome the user sees: the confirmation sheet message, the new row or total, the screen it lands on.
- **Negative (`@negative`):** invalid or missing input, or an action that isn't allowed. Examples: an empty required field, a zero or negative amount, a date out of range, a duplicate name, paying more than is owed, a wrong code. Assert the app's error message, and assert that nothing changed (no new row, totals unchanged).
- Add more negatives when the code has several distinct rules, one per rule. Copy each error text from the code; don't guess it.
- Tag every scenario `@halaga @feature-<slug>` plus `@positive` or `@negative`. Write the scenario name as the rule, e.g. `Scenario: A budget needs an amount above zero`.

**3. Code it like the existing Halaga tests:**
- **Locators:** add to `src/pages/locators/halaga.locators.js` under a key for the area. Prefer the app's ids.
- **Actions and assertions:** put them in `src/pages/halaga/halaga-money-page.js` or `halaga-app-page.js`. For a big area, make a new `src/pages/halaga/halaga-<area>-page.js` and register it in `src/pages/page-object-manager.js`.
- **Steps:** add to `src/step-definitions/halaga.steps.js`. Reuse existing steps first, e.g. `I start Halaga with no data`, `I record a Halaga transaction`, `Halaga should confirm it was logged with …`, `I open the "…" tab`. Keep new steps generic, with data tables, not one-off.
- **Data:** test data only, made up in the scenario. Never copy the owner's real figures from `data/`.
- **Native-only features:** features that need the real device can't be tested here (camera scan, Face ID unlock, notifications, the share sheet, icons, Claude). Test their web side where it has one, e.g. `readScan` filling the form through the bridge stub. Otherwise list them for the user as not covered.

**4. Run only the new tests locally**, against the same app version CI will test:
```bash
HEADLESS=true npx cucumber-js --tags "@feature-<slug>" --format summary
```
To test a GitHub version the local copy doesn't have, set `APP_HALAGA_DIR` to a checkout of that ref.
- **Positive scenario fails:** read the error and the screenshot. If the test is wrong, fix the test. If the app is wrong, leave the test as it is: the run in Step 3 will open the issue.
- **Negative scenario fails because the app accepts bad input:** that's an app bug. Keep the test, and don't weaken it to pass.
- Also run the whole suite once (`npm run test:halaga`), so nothing else broke.

**5. Ship and record:**
- Commit the tests on a branch, open a PR, and let the user merge it. CI only runs what's on `main`.
- After the new tests pass in CI, or fail only for real app bugs, write the tested app SHA (the script's last line) into `tested-commit.txt` in the same PR or a follow-up one. The next check then starts from there.
- Tell the user which features got tests (with a positive/negative count each), which gaps remain, and which features are native-only and not covered.

## Step 3 — Run the tests and sync issues

### 3a. In CI

```bash
gh workflow run "Halaga tests" -R robertLacasandile/CucumberPlaywrightFramework --ref main -f app_ref=main
sleep 5; gh run list -R robertLacasandile/CucumberPlaywrightFramework --workflow "Halaga tests" --limit 1 --json databaseId,url -q '.[0]|"\(.databaseId) \(.url)"'
```

- Give the user the run URL. To test a different app branch or commit, change `app_ref`.
- Wait in the background, and don't poll:

```bash
gh run watch <id> -R robertLacasandile/CucumberPlaywrightFramework --interval 20 >/dev/null 2>&1; gh run view <id> -R robertLacasandile/CucumberPlaywrightFramework --json conclusion,jobs -q '.conclusion, (.jobs[0].steps[]|"\(.conclusion)\t\(.name)")'
```

Then go to Step 4.

### 3b. Locally

Preview first:
```bash
npm run test:halaga
npm run issues:sync:dry
```
When the user wants the issues created:
```bash
npm run issues:sync
```
To run the tests and the sync in one go:
```bash
npm run test:halaga:issues
```

## Step 4 — Read the result

**Which step failed** (CI):

| Failed step | Cause | Fix |
|---|---|---|
| Checkout HalagaApplication, `could not read Username` | Secret is empty or the token is invalid | Setup D, then E |
| Checkout HalagaApplication, `returned error: 403` | Token has no access to the repo or to Contents | Setup D (Repository access, Contents: Read-only) |
| Install WebKit, `does not support webkit on ubuntuXX` | Runner image is too new for this Playwright | Pin `runs-on` to a supported Ubuntu (currently `ubuntu-24.04`) |
| Run Halaga tests, every scenario failed in `Before` | Browser didn't launch (e.g. `Unknown option --disable-dev-shm-usage`) | Pass Chromium flags only to Chromium in `browser-factory.js` |
| Sync GitHub issues, `Resource not accessible by personal access token (HTTP 403)` | Token can't write issues or create the label | Setup D (Issues: Read and write; click **Update**) |
| Sync GitHub issues, `every scenario failed before it started` | Setup failure; no issues opened, which is intended | Fix the setup error it prints |

**Test results:** download the report and summarize it:
```bash
D="$(mktemp -d)"; gh run download <id> -R robertLacasandile/CucumberPlaywrightFramework -n halaga-test-reports -D "$D"
python3 -c "
import json,sys;from collections import Counter;c=Counter()
for f in json.load(open(sys.argv[1])):
  for e in f['elements']:
    st=[s['result']['status'] for s in e['steps']]
    r='failed' if 'failed' in st else 'passed' if all(x=='passed' for x in st) else 'other';c[r]+=1
    if r!='passed':
      s=next(s for s in e['steps'] if s['result']['status']!='passed');print(r,'|',e['name'],'|',s.get('name') or s['keyword'],'|',(s['result'].get('error_message') or '')[:200].replace(chr(10),' '))
print(dict(c))" "$D/reports/cucumber-report.json"
```

**Issue actions:** the sync log lines start with `[ISSUES]`:
```bash
gh run view <id> -R robertLacasandile/CucumberPlaywrightFramework --log | grep -E '\[ISSUES\]|##\[error\]' | sed 's/^.*Z //'
gh issue list -R robertLacasandile/HalagaApplication --label automated-test --state all
```

**A failing scenario:** check whether it's an app bug or a test problem, e.g. a selector that changed or a timing issue. Read the error and the screenshot in `target/screenshots`, and the app code under `src/main/resources/ph/debtplanner/mobile/`. Tell the user which it is. Don't edit tests to make an app bug pass.

## Step 5 — Report

Tell the user:
- the new features found, and the positive/negative tests written for each;
- the run link;
- pass/fail counts;
- each issue opened, commented, reopened or closed, with links;
- anything still blocking, with the setup step that fixes it.

Remind them that commits naming `#<issue>` get linked, and the issue closes once the test passes.

---

## Setup (only for steps the preflight marks MISSING)

### A. GitHub CLI and the app repo
- `gh auth login` (the user runs it in a Terminal tab). It needs the `repo` and `workflow` scopes.
- Check that `gh repo view robertLacasandile/HalagaApplication` works and that issues are enabled: on the repo, **Settings → General → Features → Issues**.
- If the user's local `~/debt-planner` should name commits, it must be a git checkout of HalagaApplication. Ask before changing their folder.

### B. Framework files on `main`
These files must exist and be merged to `main`:
- `src/framework/reporting/github-issue-sync.js`
- `.github/workflows/halaga.yml`
- the Halaga pages, steps and features
- `github.issues.*` keys in `config/global.properties`:
```properties
github.issues.repo=robertLacasandile/HalagaApplication
github.issues.tags=@halaga
github.issues.label=automated-test
github.issues.appDir=~/debt-planner
```
The workflow must:
- run on `ubuntu-24.04`;
- check out HalagaApplication into `halaga-app` with `token: ${{ secrets.HALAGA_REPO_TOKEN }}`;
- set `APP_HALAGA_DIR` and `HALAGA_COMMIT`;
- run `npx playwright install --with-deps webkit`;
- run `npm run test:halaga` with `continue-on-error`;
- run `npm run issues:sync` with `GH_TOKEN: ${{ secrets.HALAGA_REPO_TOKEN }}`, only when the test step's outcome is `success` or `failure`;
- upload `target/reports` and `target/screenshots`;
- fail the job if the tests failed.

Changes go through a branch and a PR. The user merges.

### C. Local run
```bash
npm ci
npx playwright install webkit
```
`app.halaga.dir` must point at the app's `src/main/resources/ph/debtplanner/mobile`. The default is `~/debt-planner/...`, and `APP_HALAGA_DIR` overrides it.

### D. Fine-grained token (the user does this in the browser)
1. Open https://github.com/settings/personal-access-tokens/new.
2. Fill in:
   - **Name:** `Halaga test issues`
   - **Expiration:** the user's choice
   - **Resource owner:** `robertLacasandile`
   - **Repository access:** Only select repositories → **HalagaApplication**
3. Under **Repository permissions**, set:
   - **Contents:** Read-only
   - **Issues:** Read and write
   - **Metadata:** Read-only (set automatically)
4. Click **Generate token** and copy it. **Don't paste it into chat.**

To change an existing token: open it, click **Edit**, change the permissions, and click **Update**. The value stays the same, so the secret doesn't need to be saved again. Only **Regenerate** changes the value, which means doing step E again.

### E. Save it as the secret (the user does this in a Terminal tab, not the chat input)
```bash
gh secret set HALAGA_REPO_TOKEN -R robertLacasandile/CucumberPlaywrightFramework
```
They paste the token at `? Paste your secret:` (nothing shows), press Enter, and wait for `✓ Set Actions secret …`. Confirm with:
```bash
gh secret list -R robertLacasandile/CucumberPlaywrightFramework
```
The updated time should be recent. The browser works too: framework repo → **Settings → Secrets and variables → Actions → New repository secret**.

### F. Optional: run on every app push
Add a workflow to HalagaApplication that sends `repository_dispatch` with the type `halaga-pushed` and `client_payload.ref` set to the pushed SHA to this repo. `halaga.yml` already listens for it. That workflow needs a token that can dispatch to CucumberPlaywrightFramework.

Alternatively, move `halaga.yml` into HalagaApplication. There it can use GitHub's built-in token with `permissions: issues: write` for its own issues, so step D's Issues permission isn't needed.
