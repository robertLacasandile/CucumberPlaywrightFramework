const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sessionId = process.env.EXECUTION_SESSION_ID || crypto.randomUUID();
const targetDir = path.resolve(process.cwd(), 'target');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function initExecutionPaths() {
  ensureDir(targetDir);
  ensureDir(path.join(targetDir, 'reports'));
  ensureDir(path.join(targetDir, 'screenshots'));
  ensureDir(path.join(targetDir, 'traces'));
  ensureDir(path.join(targetDir, 'videos'));
}

module.exports = {
  sessionId,
  initExecutionPaths,
  reportsDir: path.join(targetDir, 'reports'),
  screenshotsDir: path.join(targetDir, 'screenshots'),
  tracesDir: path.join(targetDir, 'traces'),
  videosDir: path.join(targetDir, 'videos')
};
