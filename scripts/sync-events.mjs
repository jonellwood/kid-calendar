import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(rootDir, 'data/events.json');
const targetPath = resolve(rootDir, 'public/data/events.json');

const raw = await readFile(sourcePath, 'utf8');
const parsed = JSON.parse(raw);

if (!parsed || !Array.isArray(parsed.events)) {
  throw new Error('data/events.json must contain an {"events": []} payload.');
}

await mkdir(dirname(targetPath), { recursive: true });
await writeFile(targetPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');

console.log(`Synced ${sourcePath} -> ${targetPath}`);
