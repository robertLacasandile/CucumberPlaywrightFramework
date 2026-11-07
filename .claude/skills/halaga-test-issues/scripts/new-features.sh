#!/usr/bin/env bash
# Finds Halaga features that are new since the last tested app commit, and UI the tests don't touch yet.
# Read-only: it only reads GitHub and local files.
# Usage: new-features.sh [app-ref]   (default: main)
# Baseline: .claude/skills/halaga-test-issues/tested-commit.txt (the app SHA last covered by tests).
set -u
APP_REPO="robertLacasandile/HalagaApplication"
REF="${1:-main}"
FW="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
BASE_FILE="$FW/.claude/skills/halaga-test-issues/tested-commit.txt"
BUNDLE="src/main/resources/ph/debtplanner/mobile"
LOCATORS="$FW/src/pages/locators/halaga.locators.js"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

HEAD_SHA="$(gh api "repos/$APP_REPO/commits/$REF" -q .sha)" || { echo "Cannot read $APP_REPO@$REF"; exit 2; }
BASE_SHA="$(grep -Eo '^[0-9a-f]{7,40}' "$BASE_FILE" 2>/dev/null | head -1)"
echo "App $APP_REPO@$REF = ${HEAD_SHA:0:7}; baseline = ${BASE_SHA:-none}"
echo

# 1. What changed in the app since the baseline: commits and bundle files.
if [ -n "$BASE_SHA" ] && [ "$BASE_SHA" != "$HEAD_SHA" ]; then
  echo "== Commits since ${BASE_SHA:0:7} =="
  gh api "repos/$APP_REPO/compare/$BASE_SHA...$HEAD_SHA" -q '.commits[]|"  \(.sha[0:7]) \(.commit.message|split("\n")[0])"'
  echo
  echo "== Changed files in the web bundle and docs =="
  gh api "repos/$APP_REPO/compare/$BASE_SHA...$HEAD_SHA" -q '.files[]|select((.filename|startswith("'"$BUNDLE"'")) or .filename=="CLAUDE.md")|"  \(.status)\t+\(.additions) -\(.deletions)\t\(.filename)"'
  echo
  echo "== New lines in CLAUDE.md (feature notes) =="
  gh api "repos/$APP_REPO/compare/$BASE_SHA...$HEAD_SHA" -q '.files[]|select(.filename=="CLAUDE.md")|.patch' \
    | grep '^+' | grep -v '^+++' | sed 's/^+/  /' | head -60
  echo
elif [ -n "$BASE_SHA" ]; then
  echo "== No app commits since the baseline =="
  echo
else
  echo "== No baseline yet: treat every untested screen below as new =="
  echo
fi

# 2. UI in the current app that no locator touches (coverage gaps), whatever the history.
gh api "repos/$APP_REPO/contents/$BUNDLE/index.html?ref=$HEAD_SHA" -H 'Accept: application/vnd.github.raw' > "$TMP/index.html" \
  || { echo "Cannot read index.html"; exit 2; }
covered() { grep -qF -- "$1" "$LOCATORS" 2>/dev/null; }

echo "== Screens (section.view) with no test locator =="
grep -Eo '<section class="view[^"]*" id="v-[a-z0-9-]+"' "$TMP/index.html" | grep -Eo 'v-[a-z0-9-]+' | sort -u | while read -r v; do
  name="${v#v-}"
  covered "#v-$name" || covered "view(\`$name" || grep -qE "['\"]$name['\"]" "$FW/src/step-definitions/halaga.steps.js" || echo "  $v"
done
echo
echo "== Sheets / dialogs with no test locator =="
grep -Eo 'id="[a-zA-Z]+Sheet"' "$TMP/index.html" | grep -Eo '[a-zA-Z]+Sheet' | sort -u | while read -r s; do covered "#$s" || echo "  #$s"; done
echo
echo "== Forms with no test locator =="
grep -Eo '<form id="[a-zA-Z0-9-]+"' "$TMP/index.html" | grep -Eo 'id="[^"]+"' | cut -d'"' -f2 | sort -u | while read -r f; do covered "#$f" || echo "  #$f"; done
echo
echo "Head commit for the baseline after the new tests pass: $HEAD_SHA"
