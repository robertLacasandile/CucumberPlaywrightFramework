const fs = require('fs');
const http = require('http');
const path = require('path');
const logger = require('../logging/framework-logger').getLogger('StaticServer');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

const servers = new Map();

/**
 * Serves a folder over http://127.0.0.1 on a free port, once per folder per worker process.
 * Used for apps whose UI is plain web files, such as the Halaga iOS app's WKWebView bundle.
 */
async function serveFolder(folder) {
  const root = path.resolve(folder);
  if (servers.has(root)) {
    return servers.get(root).url;
  }
  if (!fs.existsSync(path.join(root, 'index.html'))) {
    throw new Error(`No index.html found in ${root}`);
  }

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (urlPath === '/' ? '/index.html' : urlPath));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(file).pipe(res);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const url = `http://127.0.0.1:${server.address().port}/`;
  servers.set(root, { server, url });
  logger.phase('SERVER', 'Serving {} at {}', root, url);
  return url;
}

async function stopAll() {
  await Promise.all([...servers.values()].map(({ server }) => new Promise((resolve) => server.close(resolve))));
  servers.clear();
}

module.exports = {
  serveFolder,
  stopAll
};
