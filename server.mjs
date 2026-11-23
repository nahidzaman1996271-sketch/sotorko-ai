import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

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
  if (request.method !== 'GET' || !asset) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const [file, contentType] = asset;
    const body = await readFile(new URL(`./${file}`, import.meta.url));
    const type = contentType.startsWith('text/') ? `${contentType}; charset=utf-8` : contentType;
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }).end(body);
  } catch (error) {
    console.error(error);
    response.writeHead(500).end('Could not load the dashboard');
  }
}).listen(4173, '127.0.0.1', () => {
  console.log('Sotorko AI demo at http://127.0.0.1:4173');
});
