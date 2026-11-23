import { readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const browserFiles = [
  'index.html', 'style.css', 'favicon.png', 'dashboard.js', 'basin.js', 'simulation.js',
  'src/adapters/dataSource.js', 'src/adapters/delivery.js', 'src/styles/tokens.css',
];

for (const folder of ['src/agents', 'src/core', 'src/ui']) {
  const entries = await readdir(new URL(folder, root), { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) {
      browserFiles.push(`${folder}/${entry.name}`);
    }
  }
}

export { browserFiles, root };
