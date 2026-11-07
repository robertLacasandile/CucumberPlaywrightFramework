#!/usr/bin/env node
/**
 * Turns a Cucumber run into GitHub issues, one issue per test scenario:
 *   - a scenario fails and has no open issue  -> open one (or reopen its earlier, closed one)
 *   - a scenario fails and already has one    -> comment "still failing" on it
 *   - a scenario passes and has an open issue -> comment "passed" and close it
 *
 * Each issue carries a hidden key in its body (<!-- test-key: ... -->), so later runs find it again.
 * Commits are linked by writing the issue number in the commit message (e.g. "Refs #12"); GitHub
 * then lists the commit on the issue. Every comment also names the app commit that was tested.
 *
 * Usage: node src/framework/reporting/github-issue-sync.js [--dry-run] [--report path]
 * Uses the gh CLI (gh auth login locally; GH_TOKEN in CI, with issues write access to the repo).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { config } = require('../config/config-manager');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || config.getBoolean('github.issues.dryRun', false);
const reportPath = path.resolve(argValue('--report') || 'target/reports/cucumber-report.json');
const repo = config.get('github.issues.repo');
const label = config.get('github.issues.label', 'automated-test');
const tags = String(config.get('github.issues.tags', '')).split(',').map((t) => t.trim()).filter(Boolean);
const appDir = expandHome(config.get('github.issues.appDir', config.get('app.halaga.dir', '')));

function argValue(name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

function expandHome(p) {
  return p ? p.replace(/^~(?=\/)/, process.env.HOME) : p;
}

function gh(ghArgs, input) {
  return execFileSync('gh', ghArgs, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] });
}

function api(method, endpoint, body) {
  const out = gh(['api', '--method', method, endpoint, ...(body ? ['--input', '-'] : [])], body ? JSON.stringify(body) : undefined);
  return out.trim() ? JSON.parse(out) : null;
}

/** The app commit under test: HALAGA_COMMIT (set in CI), else HEAD of the app folder if it is a git checkout. */
function appCommit() {
  if (process.env.HALAGA_COMMIT) return process.env.HALAGA_COMMIT;
  if (!appDir) return null;
  try {
    return execFileSync('git', ['-C', appDir, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function runLink() {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  return GITHUB_RUN_ID ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` : null;
}

function readScenarios() {
  if (!fs.existsSync(reportPath)) {
    throw new Error(`No Cucumber JSON report at ${reportPath}. Run the tests first.`);
  }
  const features = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const scenarios = [];
  for (const feature of features) {
    for (const el of feature.elements || []) {
      if (el.type !== 'scenario') continue;
      const tagNames = (el.tags || []).map((t) => t.name);
      if (tags.length && !tags.some((t) => tagNames.includes(t))) continue;

      const steps = (el.steps || []).filter((s) => s.name);
      const statuses = (el.steps || []).map((s) => s.result?.status);
      const status = statuses.includes('failed') ? 'failed'
        : statuses.every((s) => s === 'passed') ? 'passed'
          : 'other'; // skipped, pending, undefined, ambiguous: leave the issue as it is
      const failedStep = (el.steps || []).find((s) => s.result?.status === 'failed');
      const isOutline = /outline|template/i.test(el.keyword);
      // outline rows share a name and id, so the row's own step text tells them apart
      const rowHash = isOutline
        ? ' #' + crypto.createHash('sha1').update(steps.map((s) => s.name).join('\n')).digest('hex').slice(0, 8)
        : '';
      const example = isOutline ? exampleValues(steps) : '';

      scenarios.push({
        key: `${feature.uri}::${el.name}${rowHash}`,
        title: `${el.name}${example ? ` (${example})` : ''}`,
        feature: feature.name,
        uri: `${feature.uri}:${el.line}`,
        tags: tagNames,
        status,
        steps: (el.steps || []).filter((s) => s.name).map((s) => `${statusMark(s.result?.status)} ${s.keyword.trim()} ${s.name}`),
        failedStep: failedStep ? `${failedStep.keyword.trim()} ${failedStep.name || failedStep.match?.location || 'hook'}` : null,
        error: failedStep?.result?.error_message || null
      });
    }
  }
  return scenarios;
}

function exampleValues(steps) {
  const values = new Set();
  for (const s of steps) for (const m of s.name.matchAll(/"([^"]*)"/g)) values.add(m[1]);
  return [...values].slice(0, 3).join(', ');
}

function statusMark(status) {
  return { passed: '✅', failed: '❌', skipped: '⏭️' }[status] || '⚪';
}

function stripAnsi(text) {
  return String(text).replace(/\u001b\[[0-9;]*m/g, '');
}

function keyMarker(key) {
  return `<!-- test-key: ${key} -->`;
}

/** Every issue (open and closed) carrying our label, by key. Newest wins when a key repeats. */
function existingIssues() {
  const byKey = new Map();
  const out = gh(['api', '--paginate', '--jq', '.[]', `repos/${repo}/issues?state=all&labels=${encodeURIComponent(label)}&per_page=100`]);
  const issues = out.split('\n').filter(Boolean).map((line) => JSON.parse(line));
  for (const issue of issues) {
    if (issue.pull_request) continue;
    const m = /<!-- test-key: (.+?) -->/.exec(issue.body || '');
    if (!m) continue;
    const prev = byKey.get(m[1]);
    if (!prev || issue.number > prev.number) byKey.set(m[1], issue);
  }
  return byKey;
}

function ensureLabel() {
  try {
    api('GET', `repos/${repo}/labels/${encodeURIComponent(label)}`);
  } catch {
    if (!dryRun) {
      api('POST', `repos/${repo}/labels`, { name: label, color: 'b60205', description: 'Opened and closed by the automated test run' });
    }
  }
}

function runLine(commit) {
  const parts = [`**Run:** ${new Date().toISOString()}`];
  if (commit) parts.push(`**App commit:** ${repo}@${commit}`);
  const link = runLink();
  if (link) parts.push(`**CI run:** ${link}`);
  return parts.join(' · ');
}

function failureDetails(s) {
  const error = s.error ? stripAnsi(s.error).slice(0, 4000) : 'No error message in the report.';
  return [
    `**Failed step:** \`${s.failedStep || 'unknown'}\``,
    '',
    '<details><summary>Error</summary>',
    '',
    '```',
    error,
    '```',
    '</details>',
    '',
    '<details><summary>Steps</summary>',
    '',
    s.steps.join('\n'),
    '</details>'
  ].join('\n');
}

function newIssueBody(s, commit) {
  return [
    keyMarker(s.key),
    `Automated test **${s.title}** is failing.`,
    '',
    `**Feature:** ${s.feature} (\`${s.uri}\`)`,
    `**Tags:** ${s.tags.join(' ')}`,
    runLine(commit),
    '',
    failureDetails(s),
    '',
    '---',
    'Put this issue number in the commits that work on it, for example `Refs #<number>`, so they are listed here.',
    'The test run closes this issue by itself the next time the test passes.'
  ].join('\n');
}

function main() {
  if (!repo) throw new Error('Set github.issues.repo in config/global.properties (owner/name).');
  const commit = appCommit();
  const scenarios = readScenarios();
  console.log(`[ISSUES] ${scenarios.length} scenario(s) from ${path.relative(process.cwd(), reportPath)} -> ${repo}${dryRun ? ' (dry run)' : ''}`);

  ensureLabel();
  const issues = existingIssues();
  const summary = { opened: 0, reopened: 0, commented: 0, closed: 0 };

  for (const s of scenarios) {
    const issue = issues.get(s.key);
    if (s.status === 'failed') {
      if (issue && issue.state === 'open') {
        console.log(`[ISSUES] still failing  #${issue.number} ${s.title}`);
        if (!dryRun) api('POST', `repos/${repo}/issues/${issue.number}/comments`, { body: `❌ Still failing.\n\n${runLine(commit)}\n\n${failureDetails(s)}` });
        summary.commented++;
      } else if (issue) {
        console.log(`[ISSUES] reopen         #${issue.number} ${s.title}`);
        if (!dryRun) {
          api('PATCH', `repos/${repo}/issues/${issue.number}`, { state: 'open' });
          api('POST', `repos/${repo}/issues/${issue.number}/comments`, { body: `❌ Failing again, reopened.\n\n${runLine(commit)}\n\n${failureDetails(s)}` });
        }
        summary.reopened++;
      } else {
        console.log(`[ISSUES] open new       ${s.title}`);
        if (!dryRun) {
          const created = api('POST', `repos/${repo}/issues`, {
            title: `Test failing: ${s.title}`.slice(0, 250),
            body: newIssueBody(s, commit),
            labels: [label, 'bug']
          });
          console.log(`[ISSUES]   -> ${created.html_url}`);
        }
        summary.opened++;
      }
    } else if (s.status === 'passed' && issue && issue.state === 'open') {
      console.log(`[ISSUES] passed, close  #${issue.number} ${s.title}`);
      if (!dryRun) {
        api('POST', `repos/${repo}/issues/${issue.number}/comments`, { body: `✅ Passing now, closing.\n\n${runLine(commit)}` });
        api('PATCH', `repos/${repo}/issues/${issue.number}`, { state: 'closed', state_reason: 'completed' });
      }
      summary.closed++;
    }
  }

  console.log(`[ISSUES] opened ${summary.opened}, reopened ${summary.reopened}, still failing ${summary.commented}, closed ${summary.closed}`);
}

try {
  main();
} catch (error) {
  console.error(`[ISSUES] ERROR - ${error.stderr ? String(error.stderr).trim() : error.message}`);
  process.exitCode = 1;
}
