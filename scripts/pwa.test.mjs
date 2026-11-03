import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { generateWorker } from '../pwa/build-plugin.mjs';
import { createPwaController } from '../src/helpers/Pwa.mjs';

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
function environment() {
  const listeners = new Map();
  const host = { navigator: { onLine: true, userAgent:'Android', platform:'Linux', maxTouchPoints:1 },
    matchMedia: () => ({ matches:false, addEventListener(){}, removeEventListener(){} }),
    addEventListener: (name, fn) => listeners.set(name,fn), removeEventListener: name => listeners.delete(name),
  };
  return { host, listeners };
}
test('prompt só abre por ação do usuário e é consumido uma única vez', async () => {
  const {host,listeners}=environment(); const state={}; const controller=createPwaController(host,state);
  let prompts=0;
  listeners.get('beforeinstallprompt')({preventDefault(){},prompt:async()=>{prompts++;},userChoice:Promise.resolve({outcome:'dismissed'})});
  assert.equal(state.canInstall,true); assert.equal(prompts,0);
  await controller.install(); await controller.install(); assert.equal(prompts,1); assert.equal(state.canInstall,false);
  listeners.get('appinstalled')(); assert.equal(state.installed,true); controller.stop(); assert.equal(listeners.size,0);
});
test('iPad é reconhecido e atualização aguardando não força reload', async () => {
  const {host}=environment();host.navigator.platform='MacIntel';host.navigator.maxTouchPoints=5;
  host.navigator.serviceWorker={register:async(path,options)=>{assert.equal(path,'/sw.js');assert.equal(options.updateViaCache,'none');return {waiting:{},addEventListener(){}};}};
  const state={}; const controller=createPwaController(host,state);await controller.register(); assert.equal(state.ios,true);assert.equal(state.updateAvailable,true);
});
