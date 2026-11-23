import { copyFile, mkdir, rm } from 'node:fs/promises';
import { browserFiles, root } from './assets.mjs';

const dist = new URL('dist/', root);
await rm(dist, { recursive: true, force: true });
for (const file of browserFiles) {
  const destination = new URL(file, dist);
  await mkdir(new URL('.', destination), { recursive: true });
  await copyFile(new URL(file, root), destination);
}
console.log(`Built ${browserFiles.length} browser assets in dist/.`);
