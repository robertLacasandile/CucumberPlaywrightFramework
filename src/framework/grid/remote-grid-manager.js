const { spawnSync } = require('child_process');
const net = require('net');
const { config } = require('../config/config-manager');
const logger = require('../logging/framework-logger').getLogger('RemoteGridManager');

let startedByFramework = false;

function isRemoteGridMode() {
  const mode = (process.env.EXECUTION_MODE || config.get('execution.mode', 'local')).toLowerCase();
  return mode === 'remote-grid' || mode === 'remotegrid';
}

function isAutoManageEnabled() {
  return config.getBoolean('remote.grid.auto.manage', true);
}

async function waitUntilReady() {
  const timeoutSeconds = config.getNumber('remote.grid.start.timeout.seconds', 60);
  const gridUrl = new URL(config.get('remote.grid.url', 'ws://127.0.0.1:4444/'));
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (Date.now() < deadline) {
    if (await canConnect(gridUrl.hostname, Number(gridUrl.port || 4444))) {
      logger.success('GRID', 'Playwright server is ready');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Playwright server was not ready within ${timeoutSeconds} seconds`);
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 1000 }, () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function dockerCompose(...args) {
  const composeFile = config.get('remote.grid.compose.file', 'selenium-grid-docker-compose.yml');
  const result = spawnSync('docker', ['compose', '-f', composeFile, ...args], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`docker compose ${args.join(' ')} failed with exit code ${result.status}`);
  }
}

async function startIfRequired() {
  if (!isRemoteGridMode() || !isAutoManageEnabled() || startedByFramework) {
    return;
  }

  logger.phase('GRID', 'Starting Selenium Grid with Docker Compose');
  dockerCompose('up', '-d');
  await waitUntilReady();
  startedByFramework = true;
}

function stopIfRequired() {
  if (!isRemoteGridMode() || !isAutoManageEnabled() || !startedByFramework) {
    return;
  }

  logger.phase('GRID', 'Stopping Selenium Grid Docker containers');
  dockerCompose('down');
  startedByFramework = false;
}

module.exports = {
  startIfRequired,
  stopIfRequired
};
