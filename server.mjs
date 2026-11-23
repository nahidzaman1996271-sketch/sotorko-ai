import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

// Hosts such as Render set PORT and need 0.0.0.0; locally it stays on 127.0.0.1:4173.
const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');

const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ['/dashboard.js', ['dashboard.js', 'text/javascript']],
  ['/basin.js', ['basin.js', 'text/javascript']],
  ['/favicon.png', ['favicon.png', 'image/png']],
  ['/simulation.js', ['simulation.js', 'text/javascript']],
]);

createServer(async (request, response) => {
  const path = request.url.split('?')[0];
  const asset = assets.get(path);
  if (!['GET', 'HEAD'].includes(request.method) || !asset) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const [file, contentType] = asset;
    const body = await readFile(new URL(`./${file}`, import.meta.url));
    const type = contentType.startsWith('text/') ? `${contentType}; charset=utf-8` : contentType;
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }).end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    console.error(error);
    response.writeHead(500).end('Could not load the dashboard');
  }
}).listen(port, host, () => {
  console.log(`Sotorko AI demo at http://${host}:${port}`);
});
