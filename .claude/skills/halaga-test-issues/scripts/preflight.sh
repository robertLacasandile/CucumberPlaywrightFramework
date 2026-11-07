#!/usr/bin/env bash
# Checks everything the Halaga test → GitHub issues flow needs, without touching any secret value.
# Prints one line per check: OK / MISSING / WARN, then a summary. Exit 0 when CI mode is ready.
# Usage: preflight.sh [framework-dir]
set -u
FW="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
FW_REPO="robertLacasandile/CucumberPlaywrightFramework"
APP_REPO="robertLacasandile/HalagaApplication"
cd "$FW" || { echo "MISSING framework folder $FW"; exit 2; }

ci_ready=1
local_ready=1
ok()   { printf 'OK       %s\n' "$1"; }
miss() { printf 'MISSING  %s\n' "$1"; }
warn() { printf 'WARN     %s\n' "$1"; }

# --- shared -------------------------------------------------------------------
if gh auth status >/dev/null 2>&1; then ok "gh is logged in"; else miss "gh is not logged in (setup step A)"; ci_ready=0; local_ready=0; fi

if gh repo view "$APP_REPO" --json name >/dev/null 2>&1; then
  ok "can see $APP_REPO"
  if [ "$(gh repo view "$APP_REPO" --json hasIssuesEnabled -q .hasIssuesEnabled 2>/dev/null)" = "true" ]; then ok "issues are enabled on $APP_REPO"; else miss "issues are turned off on $APP_REPO (setup step A)"; ci_ready=0; local_ready=0; fi
else
  miss "cannot see $APP_REPO with the gh login (setup step A)"; ci_ready=0; local_ready=0
fi

for f in src/framework/reporting/github-issue-sync.js src/step-definitions/halaga.steps.js .github/workflows/halaga.yml; do
  if [ -f "$f" ]; then ok "$f present"; else miss "$f not in this checkout (setup step B)"; ci_ready=0; local_ready=0; fi
done
if grep -q '^github.issues.repo=' config/global.properties 2>/dev/null; then ok "github.issues.* set in config/global.properties"; else miss "github.issues.repo not set (setup step B)"; ci_ready=0; local_ready=0; fi

# --- local mode ---------------------------------------------------------------
APP_DIR="$(grep '^app.halaga.dir=' config/global.properties 2>/dev/null | cut -d= -f2-)"
APP_DIR="${APP_HALAGA_DIR:-${APP_DIR/#\~/$HOME}}"
if [ -n "$APP_DIR" ] && [ -f "$APP_DIR/index.html" ]; then ok "local Halaga bundle at $APP_DIR"; else miss "no Halaga bundle at '${APP_DIR}' (setup step C)"; local_ready=0; fi
if [ -d node_modules/playwright ]; then ok "node_modules installed"; else miss "node_modules missing: npm ci (setup step C)"; local_ready=0; fi
if ls "$HOME/Library/Caches/ms-playwright" 2>/dev/null | grep -q '^webkit-' || ls "$HOME/.cache/ms-playwright" 2>/dev/null | grep -q '^webkit-'; then ok "Playwright WebKit installed"; else miss "Playwright WebKit missing: npx playwright install webkit (setup step C)"; local_ready=0; fi

# --- CI mode ------------------------------------------------------------------
if git fetch -q origin main 2>/dev/null && git cat-file -e origin/main:.github/workflows/halaga.yml 2>/dev/null; then
  ok "halaga.yml is on origin/main"
  if git show origin/main:.github/workflows/halaga.yml | grep -q 'runs-on: ubuntu-24.04'; then ok "workflow pinned to ubuntu-24.04"; else warn "workflow not pinned to ubuntu-24.04 (WebKit cannot install on ubuntu-latest = 26.04)"; fi
  if git show origin/main:src/framework/core/browser-factory.js | grep -q 'browserType === chromium'; then ok "browser-factory passes Chromium flags to Chromium only"; else miss "browser-factory passes Chromium flags to WebKit (WebKit on Linux will not start)"; ci_ready=0; fi
else
  miss "halaga.yml is not on origin/main: merge it first (setup step B)"; ci_ready=0
fi

if gh secret list -R "$FW_REPO" 2>/dev/null | grep -q '^HALAGA_REPO_TOKEN'; then ok "secret HALAGA_REPO_TOKEN exists"; else miss "secret HALAGA_REPO_TOKEN not set (setup steps D-E)"; ci_ready=0; fi

# The token's permissions cannot be read; the last run's log shows how it behaved.
last="$(gh run list -R "$FW_REPO" --workflow 'Halaga tests' --limit 1 --json databaseId,conclusion -q '.[0]|"\(.databaseId) \(.conclusion)"' 2>/dev/null)"
if [ -n "$last" ]; then
  id="${last%% *}"
  log="$(gh run view "$id" -R "$FW_REPO" --log 2>/dev/null)"
  if grep -q 'could not read Username\|returned error: 403' <<<"$log"; then
    miss "last run $id: token rejected or no access to $APP_REPO contents (setup step D)"; ci_ready=0
  elif grep -q 'Resource not accessible by personal access token' <<<"$log"; then
    miss "last run $id: token cannot write issues, set Issues: Read and write (setup step D)"; ci_ready=0
  elif grep -q 'does not support webkit' <<<"$log"; then
    warn "last run $id: WebKit could not install on that runner image"
  else
    ok "last run $id ($( cut -d' ' -f2 <<<"$last")) shows no token errors"
  fi
else
  warn "no 'Halaga tests' run yet, so the token is untested"
fi

echo
[ $local_ready = 1 ] && echo "LOCAL MODE: ready" || echo "LOCAL MODE: not ready"
[ $ci_ready = 1 ] && echo "CI MODE: ready" || echo "CI MODE: not ready"
[ $ci_ready = 1 ]
