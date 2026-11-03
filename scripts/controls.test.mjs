import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { profiles, visibleControls, retroarchControls, validateControls } from '../src/helpers/Controls.mjs';
const consoles = JSON.parse(readFileSync(new URL('../src/json/consoles.json', import.meta.url)));
for (const item of consoles) test(`perfil ${item.id}: campos, botões e teclas válidos`, () => {
  assert.deepEqual(validateControls(item.id, item.controls), []);
  const shown = visibleControls(item.id, item.controls);
  const config = retroarchControls(item.id, item.controls);
  for (const [player, buttons] of Object.entries(shown)) for (const [button, key] of Object.entries(buttons)) assert.equal(config[`input_${player}_${profiles[item.id].buttons[button]}`], key);
});
test('Mega Drive traduz todos os seis botões para RetroPad, incluindo Mode', () => {
  const config = retroarchControls('gens', consoles.find(x => x.id === 'gens').controls);
  assert.deepEqual(['y','b','a','l','x','r','select'].map(k => config['input_player1_' + k]), ['z','x','c','a','s','d','space']);
  assert.equal(config.input_player1_c, undefined);
  assert.equal(config.input_player1_z, undefined);
});
test('Master System exibe 1/2 e Pause apenas no jogador 1', () => {
  const item = consoles.find(x => x.id === 'sms');
  const shown = visibleControls('sms', item.controls);
  assert.equal(shown.player1.button1, 'x'); assert.equal(shown.player1.button2, 'z');
  assert.equal(shown.player1.pause, 'enter'); assert.equal(shown.player2.pause, undefined);
  assert.equal(retroarchControls('sms', item.controls).input_player2_start, 'nul');
});
test('GBA tem apenas jogador 1, identifica turbo e limpa controles não utilizados', () => {
  const item = consoles.find(x => x.id === 'gba');
  assert.equal(visibleControls('gba', item.controls).player2, undefined);
  const config = retroarchControls('gba', item.controls);
  assert.equal(config.input_player1_x, 'a'); assert.equal(config.input_player1_y, 's');
  assert.equal(config.input_player2_a, 'nul'); assert.equal(config.input_player1_l2, 'nul');
});
test('validador rejeita controles incompletos, desconhecidos, jogador extra e teclas repetidas', () => {
  const copy = () => structuredClone(consoles.find(x => x.id === 'nes').controls);
  let map = copy(); delete map.player1.a; assert.ok(validateControls('nes', map).some(x => x.includes('obrigatório')));
  map = copy(); map.player1.c = 'q'; assert.ok(validateControls('nes', map).some(x => x.includes('não suportado')));
  map = copy(); map.player3 = {}; assert.ok(validateControls('nes', map).some(x => x.includes('jogador')));
  map = copy(); map.player1.b = map.player1.a; assert.ok(validateControls('nes', map).some(x => x.includes('duplicada')));
  map = copy(); map.player1.a = 'invalid-key'; assert.ok(validateControls('nes', map).some(x => x.includes('tecla inválida')));
  map = copy(); map.player2.a = map.player1.a; assert.ok(validateControls('nes', map).some(x => x.includes('conflito entre jogadores')));
  assert.ok(validateControls('unknown', {}).length);
});
