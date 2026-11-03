import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@vue/compiler-sfc';
import { createRouter, createMemoryHistory } from 'vue-router';

function options(path, names = [], values = []) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const script = parse(source).descriptor.script.content.replace(/^import .*;\s*$/gm, '').replace('export default', 'return');
  return new Function(...names, script)(...values);
}
const consoles = [{ id: 'nes', active: true, base_url: 'https://example.com', image: '/cover.png' }, { id: 'off', active: false }];
const roms = [{ id: 'game', console: 'nes', active: true, filename: 'game.zip', image: 'game.jpg', name: 'Game' }, { id: 'hidden', console: 'nes', active: false, name: 'Hidden' }];
const page = options('src/views/Games.vue', ['NotFound', 'Modal', 'Game', 'consoles', 'roms'], [{}, {}, {}, consoles, roms]);
function model(console_id, game_id) {
  const vm = { ...page.data(), console_id, game_id };
  for (const [name, get] of Object.entries(page.computed)) Object.defineProperty(vm, name, { get: () => get.call(vm) });
  return vm;
}

test('console desconhecido/inativo e jogo desconhecido/inativo não abrem sessão', () => {
  for (const id of ['missing', 'off']) {
    const vm = model(id, 'game');
    assert.equal(vm.consol, undefined);
    assert.equal(vm.game, null);
  }
  for (const id of ['missing', 'hidden']) assert.equal(model('nes', id).game, null);
});

test('acesso direto válido e troca de parâmetros resolvem a sessão sem pushes', () => {
  const vm = model('nes', 'game');
  assert.equal(vm.game.filename, 'https://example.com/roms/game.zip');
  vm.game_id = 'missing';
  assert.equal(vm.game, null);
  vm.game_id = 'game';
  assert.equal(vm.game.id, 'game');
  vm.game_id = undefined;
  assert.equal(vm.game, null);
});

test('abrir e fechar navegam uma vez; catálogo exclui inativos', () => {
  const vm = model('nes');
  const pushes = [];
  vm.$router = { push: route => pushes.push(route) };
  page.methods.openGame.call(vm, roms[1]);
  assert.equal(pushes.length, 0);
  page.methods.openGame.call(vm, roms[0]);
  page.methods.closeGame.call(vm);
  assert.deepEqual(pushes.map(x => x.name), ['Game', 'Games']);
  assert.equal(vm.roms.length, 1);
});

test('rotas reais reconhecem caminhos desconhecidos, sem interferir nas rotas válidas', async () => {
  const source = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8');
  const routes = new Function(source.slice(source.indexOf('const routes'), source.indexOf('const router')).replace(/\(\) => import\("[^\"]+"\)/g, '{}') + '; return routes;')();
  const router = createRouter({ history: createMemoryHistory(), routes });
  for (const [url, name] of [['/games', 'Consoles'], ['/games/nes', 'Games'], ['/games/nes/game', 'Game'], ['/about', 'About'], ['/unknown', 'NotFound'], ['/games/nes/game/extra', 'NotFound']]) {
    await router.push(url);
    assert.equal(router.currentRoute.value.name, name);
  }
});
