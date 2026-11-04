import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { generateWorker } from '../pwa/build-plugin.mjs';
import { registerPwa } from '../src/helpers/Pwa.mjs';

test('manifesto permite rotação, tem escopo e ícones reais nas dimensões declaradas', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.display, 'standalone'); assert.equal(manifest.scope, '/'); assert.equal(manifest.start_url, '/');
  assert.equal(manifest.orientation, undefined);
  for (const icon of manifest.icons) {
    const png = await readFile(new URL('../public' + icon.src, import.meta.url));
    assert.equal(png.toString('ascii', 1, 4), 'PNG');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});

test('build versiona cache pelo conteúdo e inclui bundles de rotas', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'game-over-pwa-'));
  try {
    await mkdir(join(dir, 'assets')); await writeFile(join(dir, 'index.html'), 'shell');
    await writeFile(join(dir, 'assets/game-abc.js'), 'game'); await writeFile(join(dir, 'assets/game.map'), 'debug');
    const first = await generateWorker(dir);
    assert.ok(first.urls.includes('/assets/game-abc.js')); assert.ok(!first.urls.includes('/sw.js')); assert.ok(!first.urls.some(x => x.endsWith('.map')));
    assert.equal((await generateWorker(dir)).source, first.source);
    await writeFile(join(dir, 'index.html'), 'new shell'); assert.notEqual((await generateWorker(dir)).source, first.source);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

async function worker() {
  const handlers = {}; const deleted = []; const added = [];
  const cache = { addAll: async urls => { added.push(...urls); }, match: async path => path === '/index.html' ? 'offline-shell' : 'cached-asset' };
  const source = (await readFile(new URL('../pwa/service-worker.js', import.meta.url), 'utf8')).replace('__CACHE_VERSION__','test').replace('__PRECACHE__',JSON.stringify(['/index.html','/assets/game.js']));
  runInNewContext(source, {
    self: { location: { origin: 'https://game.test' }, addEventListener: (name, fn) => { handlers[name] = fn; }, skipWaiting() { throw new Error('não deve interromper sessões'); } },
    caches: { open: async () => cache, keys: async () => ['game-over-shell-old', 'game-over-shell-test', 'unrelated'], delete: async key => deleted.push(key) },
    fetch: async () => { throw new Error('offline'); }, URL, Response,
  });
  return { handlers, deleted, added };
}
test('worker pré-carrega shell e limpa somente caches antigos próprios', async () => {
  const x = await worker(); let promise;
  x.handlers.install({ waitUntil: value => { promise = value; } }); await promise;
  assert.ok(x.added.includes('/assets/game.js'));
  x.handlers.activate({ waitUntil: value => { promise = value; } }); await promise;
  assert.deepEqual(x.deleted, ['game-over-shell-old']);
});
test('offline atende navegação e assets; ROMs externas e POST passam direto', async () => {
  const x = await worker(); let response;
  x.handlers.fetch({ request: { url: 'https://game.test/games/nes/game', method:'GET', mode:'navigate' }, respondWith: p => { response = p; } });
  assert.equal(await response, 'offline-shell');
  response = undefined;
  x.handlers.fetch({ request: { url:'https://game.test/assets/game.js', method:'GET' }, respondWith: p => { response=p; } });
  assert.equal(await response, 'cached-asset');
  for (const request of [{url:'https://roms.test/game.zip',method:'GET'}, {url:'https://game.test/save',method:'POST'}]) {
    x.handlers.fetch({ request, respondWith() { assert.fail('requisição não deve ser cacheada'); } });
  }
});
test('registro mantém worker sem interceptar instalação nativa ou forçar atualização', async () => {
  let calls = 0;
  const registration = { waiting: {} };
  const host = {
    navigator: { serviceWorker: { register: async (path, options) => {
      calls++; assert.equal(path, '/sw.js'); assert.equal(options.scope, '/');
      assert.equal(options.updateViaCache, 'none'); return registration;
    } } },
    addEventListener() { assert.fail('não deve interceptar instalação'); },
    location: { reload() { assert.fail('não deve recarregar'); } },
  };
  assert.equal(await registerPwa(host), registration); assert.equal(calls, 1);
});
test('navegador sem service worker continua funcionando', async () => {
  assert.equal(await registerPwa({ navigator: {} }), undefined);
});
