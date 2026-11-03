import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateCatalog } from './check-catalog.mjs';

function fixture() {
  return [[{ id: 'nes', name: 'Nintendo', active: true, base_url: 'https://example.com/nes', image: '/cover.png', controls: { player1: { a: 'z' } } }], [{ id: 'game$', name: 'Game', console: 'nes', active: true, filename: 'Game (USA).zip', image: 'game.jpg', id_igdb: '' }]];
}

test('aceita catálogo válido, IDs existentes e IDs iguais em consoles diferentes', () => {
  const [consoles, games] = fixture();
  consoles.push({ ...consoles[0], id: 'snes' });
  games.push({ ...games[0], console: 'snes' });
  assert.deepEqual(validateCatalog(consoles, games), []);
});

for (const [name, mutate, field] of [
  ['console duplicado', c => c.push({ ...c[0] }), 'consoles.json[1].id'],
  ['jogo duplicado', (c, g) => g.push({ ...g[0] }), 'roms.json[1].id'],
  ['console inexistente', (c, g) => { g[0].console = 'unknown'; }, 'roms.json[0].console'],
  ['tipo inválido', (c, g) => { g[0].active = 'true'; }, 'roms.json[0].active'],
  ['nome vazio', (c, g) => { g[0].name = ' '; }, 'roms.json[0].name'],
  ['URL na capa', (c, g) => { g[0].image = 'https://example.com/a.jpg'; }, 'roms.json[0].image'],
  ['diretório na ROM', (c, g) => { g[0].filename = '../game.zip'; }, 'roms.json[0].filename'],
  ['fragmento no ID', (c, g) => { g[0].id = 'game#1'; }, 'roms.json[0].id'],
  ['controle ausente', c => { delete c[0].controls.player1; }, 'consoles.json[0].controls.player1'],
  ['tecla inválida', c => { c[0].controls.player1.a = null; }, 'consoles.json[0].controls.player1.a'],
  ['origem inválida', c => { c[0].base_url = 'file:///tmp'; }, 'consoles.json[0].base_url'],
  ['marcador inválido', (c, g) => { g[0].check_image = 1; }, 'roms.json[0].check_image'],
  ['metadado inválido', (c, g) => { g[0].id_igdb = {}; }, 'roms.json[0].id_igdb'],
]) {
  test(`rejeita ${name} com localização`, () => {
    const data = fixture();
    mutate(...data);
    assert.ok(validateCatalog(...data).some(error => error.startsWith('src/json/' + field + ':')));
  });
}

test('rejeita estruturas inválidas sem lançar exceção', () => {
  for (const value of [null, {}, [], 'texto']) assert.ok(validateCatalog(value, []).length);
  assert.equal(validateCatalog([null], [42]).length, 2);
});

test('console inativo pode omitir integração; jogos inativos continuam validados', () => {
  const data = fixture();
  data[0][0] = { id: 'nes', name: 'Nintendo', active: false };
  assert.deepEqual(validateCatalog(...data), []);
  data[1][0].active = false;
  data[1][0].filename = '';
  assert.ok(validateCatalog(...data).length);
});

test('CLI retorna 0 para válido e 1 para arquivo ausente ou JSON inválido', () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-test-'));
  try {
    mkdirSync(join(dir, 'src/json'), { recursive: true });
    const root = pathToFileURL(dir + '/').href;
    const module = new URL('./check-catalog.mjs', import.meta.url).href;
    const run = () => spawnSync(process.execPath, ['--input-type=module', '-e', `import { checkCatalog } from ${JSON.stringify(module)}; process.exitCode = checkCatalog(new URL(${JSON.stringify(root)}));`], { encoding: 'utf8' });
    assert.equal(run().status, 1);
    const [consoles, games] = fixture();
    writeFileSync(join(dir, 'src/json/consoles.json'), JSON.stringify(consoles));
    writeFileSync(join(dir, 'src/json/roms.json'), JSON.stringify(games));
    assert.equal(run().status, 0);
    writeFileSync(join(dir, 'src/json/roms.json'), '{');
    const result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /src\/json\/roms.json.*JSON válido/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
