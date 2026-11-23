import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { browserFiles, root } from './scripts/assets.mjs';
import { reviewReply } from './src/adapters/llm.js';

// Hosts such as Render set PORT and need 0.0.0.0; locally it stays on 127.0.0.1:4173.
const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');

const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
]);
const assets = new Map(browserFiles.map(file => [`/${file}`, file]));
assets.set('/', 'index.html');

function isLocal(request) {
  return /^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/i.test(request.headers.host ?? '')
    && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress);
}

async function respondWithReview(request, response, apiKey) {
  if (!isLocal(request) || request.method !== 'POST') {
    response.writeHead(404).end('Not found');
    return;
  }
  if (request.headers.origin !== `http://${request.headers.host}`
    || request.headers['content-type']?.split(';')[0] !== 'application/json') {
    response.writeHead(403).end('Same-origin JSON required');
    return;
  }
  try {
    let body = '';
    request.setEncoding('utf8');
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 2048) {
        response.writeHead(413).end('Reply too long');
        return;
      }
    }
    const { text, locale } = JSON.parse(body);
    if (typeof text !== 'string' || !text.trim() || text.length > 280) throw new Error('Invalid reply');
    const result = await reviewReply(text, locale, { apiKey });
    response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(result));
  } catch {
    response.writeHead(400).end('Invalid reply');
  }
}

export function createSotorkoServer({ apiKey = process.env.OPENAI_API_KEY } = {}) {
  return createServer(async (request, response) => {
    const path = request.url.split('?')[0];
    if (path === '/api/triage-review') {
      await respondWithReview(request, response, apiKey);
      return;
    }
    const file = assets.get(path);
    if (!['GET', 'HEAD'].includes(request.method) || !file) {
      response.writeHead(404).end('Not found');
      return;
    }
    try {
      let body = await readFile(new URL(file, root));
      if (file === 'index.html' && apiKey && isLocal(request)) {
        body = body.toString('utf8').replace('</head>', '<meta name="sotorko-ai-review" content="enabled">\n</head>');
      }
      const type = types.get(extname(file));
      response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }).end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      console.error(error);
      response.writeHead(500).end('Could not load the dashboard');
    }
  });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  createSotorkoServer().listen(port, host, () => {
    console.log(`Sotorko AI demo at http://${host}:${port}`);
  });
}
