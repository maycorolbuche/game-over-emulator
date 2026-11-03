import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
export async function generateWorker(outDir) {
  const paths = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name !== 'sw.js' && !entry.name.endsWith('.map')) paths.push(path);
    }
  }
  await walk(outDir); paths.sort();
  const hash = createHash('sha256');
  const template = await readFile(new URL('./service-worker.js', import.meta.url), 'utf8');
  hash.update(template);
  for (const path of paths) { hash.update(relative(outDir, path)); hash.update(await readFile(path)); }
  const urls = paths.map(path => '/' + relative(outDir, path).split('\\').join('/'));
  const source = template.replace('__CACHE_VERSION__', hash.digest('hex').slice(0, 16)).replace('__PRECACHE__', JSON.stringify(urls));
  await writeFile(resolve(outDir, 'sw.js'), source);
  return { urls, source };
}
export default function pwaBuild() {
  let outDir;
  return { name: 'game-over-pwa', apply: 'build', configResolved(config) { outDir = resolve(config.root, config.build.outDir); }, closeBundle() { return generateWorker(outDir); } };
}
