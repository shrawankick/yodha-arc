#!/usr/bin/env node
/**
 * Minimal static preview server for Yodha Arc.
 *
 * Serves the repository root over HTTP so the service worker and relative
 * asset paths behave exactly as they do in production. No dependencies
 * required – just Node's standard library.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
const PORT = Number(process.env.PORT || 4173);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  stream.on('error', (error) => {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Error reading ${filePath}: ${error.message}`);
  });
  res.writeHead(200, { 'Content-Type': type });
  stream.pipe(res);
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  let requestedPath = path.join(ROOT, pathname);

  if (!requestedPath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(requestedPath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      requestedPath = path.join(requestedPath, 'index.html');
    }

    fs.stat(requestedPath, (statErr, stat) => {
      if (statErr || !stat.isFile()) {
        const fallback = path.join(ROOT, 'index.html');
        if (requestedPath === fallback) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not found');
          return;
        }
        sendFile(res, fallback);
        return;
      }

      sendFile(res, requestedPath);
    });
  });
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\nYodha Arc preview running at http://localhost:${PORT}\n`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down preview server.');
  server.close(() => process.exit(0));
});
