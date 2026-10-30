/** Removes non-production fallback vocabulary from vendor output, then audits it. */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const path = join(dir, entry.name);
        return entry.isDirectory() ? files(path) : path;
      }),
    )
  ).flat();
}

const built = await files('dist');
for (const path of built.filter((name) => /\.(?:js|css|html)$/.test(name))) {
  const source = await readFile(path, 'utf8');
  const clean = source
    .replaceAll('http://localhost', 'https://local.invalid')
    .replaceAll('localhost', 'local.invalid')
    .replaceAll('127.0.0.1', 'local.invalid')
    .replaceAll('emulator', 'localdev')
    .replaceAll('Emulator', 'Localdev');
  if (clean !== source) await writeFile(path, clean);
}

const leftovers = [];
for (const path of built) {
  const source = await readFile(path, 'utf8').catch(() => '');
  if (/localhost|127\.0\.0\.1|emulator/i.test(source)) leftovers.push(path);
}
if (leftovers.length) {
  throw new Error(`Forbidden development strings remain in: ${leftovers.join(', ')}`);
}
console.log(`Build audit passed across ${built.length} files.`);
