const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(process.cwd(), 'target/reports/cucumber-report.html');

if (!fs.existsSync(reportPath)) {
  console.log(`Report not found: ${reportPath}`);
  process.exit(0);
}

const opener = process.platform === 'darwin'
  ? 'open'
  : process.platform === 'win32'
    ? 'cmd'
    : 'xdg-open';

const args = process.platform === 'win32'
  ? ['/c', 'start', reportPath]
  : [reportPath];

spawn(opener, args, {
  detached: true,
  stdio: 'ignore'
}).unref();

console.log(`Opened report: ${reportPath}`);
