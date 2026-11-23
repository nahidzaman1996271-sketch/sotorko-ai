import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import test from 'node:test';
import { browserFiles, root } from './assets.mjs';
import { createSotorkoServer } from '../server.mjs';

test('all relative browser imports are public and server-only files stay outside the build', async () => {
  const publicFiles = new Set(browserFiles.map(file => new URL(file, root).href));
  for (const file of browserFiles) {
    const source = new URL(file, root);
    await access(source);
    const importPattern = file.endsWith('.js') ? /(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g
      : file.endsWith('.css') ? /@import\s+['"]([^'"]+)['"]/g : null;
    if (importPattern) {
      const code = await readFile(source, 'utf8');
      for (const [, specifier] of code.matchAll(importPattern)) {
        const target = specifier.startsWith('/') ? new URL(specifier.slice(1), root) : new URL(specifier, source);
        assert.ok(publicFiles.has(target.href), `${file} imports unpublished ${specifier}`);
      }
    }
  }
  assert.ok(!browserFiles.includes('src/adapters/llm.js'));
  assert.ok(!browserFiles.includes('server.mjs'));
  assert.ok(browserFiles.every(file => !file.includes('.test.')));
});

test('local HTTP serves browser modules and provides opt-in triage without exposing server code', async context => {
  const server = createSotorkoServer({ apiKey: '' });
  server.listen(0, '127.0.0.1');
  context.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const html = await (await fetch(base)).text();
  assert.match(html, /Sotorko AI/);
  assert.doesNotMatch(html, /name="sotorko-ai-review"/);
  const head = await fetch(`${base}/src/agents/orchestrator.js`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal((await fetch(`${base}/src/adapters/llm.js`)).status, 404);

  const endpoint = `${base}/api/triage-review`;
  const request = {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({ locale: 'bn', text: 'পাঁচ জন আটকে আছি' }),
  };
  const review = await fetch(endpoint, request);
  assert.deepEqual(await review.json(), { category: 'Rescue', source: 'rules' });
  const crossOrigin = await fetch(endpoint, { ...request, headers: { ...request.headers, Origin: 'https://example.invalid' } });
  assert.equal(crossOrigin.status, 403);

  // An HTTP chunk boundary can fall inside a Bengali character's UTF-8 bytes.
  const fragment = Buffer.from(JSON.stringify({ locale: 'bn', text: 'ছাদে' }));
  const boundary = fragment.indexOf(Buffer.from('ছ')) + 1;
  const chunked = await new Promise((resolve, reject) => {
    const upload = httpRequest(endpoint, { method: 'POST', headers: request.headers }, res => {
      res.setEncoding('utf8');
      let body = '';
      res.on('data', part => { body += part; });
      res.on('end', () => resolve(JSON.parse(body)));
    });
    upload.on('error', reject);
    upload.write(fragment.subarray(0, boundary));
    setTimeout(() => upload.end(fragment.subarray(boundary)), 15);
  });
  assert.deepEqual(chunked, { category: 'Rescue', source: 'rules' });
});
