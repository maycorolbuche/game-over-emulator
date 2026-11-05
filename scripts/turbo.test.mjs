import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bindings, createTurboInput } from '../src/helpers/TurboInput.mjs';
const consoles = JSON.parse(readFileSync(new URL('../src/json/consoles.json', import.meta.url), 'utf8'));

function setup(t, consoleId = 'gens') {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const canvas = {}, events = [];
  let active = true;
  const controls = consoles.find(console => console.id === consoleId).controls;
  const input = createTurboInput({ mapping: bindings(consoleId, controls), target: () => canvas, active: () => active,
    emit: (button, down, player) => events.push([button, down, player]) });
  const event = (code, extra = {}) => ({ code, key: code.startsWith('Shift') ? 'Shift' : code,
    target: canvas, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...extra });
  const down = (code, extra) => { const e = event(code, extra); input.keydown(e); return e; };
  const up = (code, extra) => { const e = event(code, extra); input.keyup(e); return e; };
  return { input, events, down, up, deactivate: () => { active = false; } };
}
test('botão sem Shift mantém pressão normal e ignora repetição do teclado', t => {
  const { events, down, up } = setup(t);
  down('KeyZ'); down('KeyZ', { repeat: true }); t.mock.timers.tick(500);
  assert.deepEqual(events, [['y', true, 1]]);
  up('KeyZ'); assert.deepEqual(events.at(-1), ['y', false, 1]);
});
test('Shift + botão alterna apertar/soltar e encerra quando solta o botão', t => {
  const { events, down, up } = setup(t);
  down('ShiftLeft'); const key = down('KeyZ', { shiftKey: true });
  assert.equal(key.prevented, true); assert.equal(key.stopped, true);
  t.mock.timers.tick(50); t.mock.timers.tick(50);
  assert.deepEqual(events, [['y', true, 1], ['y', false, 1], ['y', true, 1]]);
  up('KeyZ'); const count = events.length; t.mock.timers.tick(1000);
  assert.equal(events.length, count); assert.deepEqual(events.at(-1), ['y', false, 1]);
});
test('apertar Shift depois do botão inicia turbo; soltar Shift restaura pressão normal', t => {
  const { events, down, up } = setup(t);
  down('KeyZ'); down('ShiftLeft'); t.mock.timers.tick(50);
  assert.deepEqual(events.at(-1), ['y', false, 1]);
  up('ShiftLeft', { shiftKey: false });
  assert.deepEqual(events.at(-1), ['y', true, 1]);
  const count = events.length; t.mock.timers.tick(500); assert.equal(events.length, count);
  up('KeyZ'); assert.deepEqual(events.at(-1), ['y', false, 1]);
});
test('dois Shifts só encerram turbo quando ambos forem soltos', t => {
  const { events, down, up } = setup(t);
  down('ShiftLeft'); down('ShiftRight'); down('KeyZ', { shiftKey: true });
  up('ShiftLeft', { shiftKey: true }); t.mock.timers.tick(50);
  assert.deepEqual(events.at(-1), ['y', false, 1]);
  up('ShiftRight', { shiftKey: false }); assert.deepEqual(events.at(-1), ['y', true, 1]);
});
test('turbo respeita mapeamento Mega Drive e mantém múltiplos botões/jogadores independentes', t => {
  const { events, down, up } = setup(t);
  down('ShiftLeft'); down('KeyZ', { shiftKey: true }); down('KeyX', { shiftKey: true }); down('KeyB', { shiftKey: true });
  assert.deepEqual(events, [['y', true, 1], ['b', true, 1], ['y', true, 2]]);
  t.mock.timers.tick(50); up('KeyZ'); t.mock.timers.tick(50);
  assert.deepEqual(events.slice(-2), [['b', true, 1], ['y', true, 2]]);
});
test('direcionais, Start/Mode, atalhos do emulador e Shift+= não são capturados', t => {
  const { events, down, up } = setup(t);
  assert.equal(down('ShiftLeft').prevented, undefined);
  for (const code of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space', 'Tab', 'F11', 'Equal', 'Backspace', 'Quote']) {
    assert.equal(down(code, { shiftKey: true }).prevented, undefined);
    assert.equal(up(code).prevented, undefined);
  }
  t.mock.timers.tick(100); assert.deepEqual(events, []);
});
test('perfis só incluem botões de ação e mantêm turbo nativo opcional do GBA fora do modificador', () => {
  for (const console of consoles) {
    const result = bindings(console.id, console.controls);
    assert.ok(result.size > 0);
    for (const binding of result.values()) assert.ok(['a', 'b', 'x', 'y', 'l', 'r'].includes(binding.button));
  }
  const gba = consoles.find(console => console.id === 'gba');
  assert.equal(bindings('gba', gba.controls).has('KeyA'), false);
});
test('campos editáveis e combinações Ctrl/Alt/Meta não são interceptados', t => {
  const { events, down } = setup(t);
  const target = { closest: () => ({}) };
  assert.equal(down('KeyZ', { shiftKey: true, target }).prevented, undefined);
  for (const modifier of ['ctrlKey', 'altKey', 'metaKey']) assert.equal(down('KeyZ', { [modifier]: true }).prevented, undefined);
  assert.deepEqual(events, []);
});
test('liberar entradas cancela pulsos e não deixa botão preso ao pausar/perder foco', t => {
  const { input, events, down } = setup(t);
  down('ShiftLeft'); down('KeyZ', { shiftKey: true });
  input.releaseAll(); const count = events.length; input.releaseAll(); t.mock.timers.tick(1000);
  assert.deepEqual(events.at(-1), ['y', false, 1]); assert.equal(events.length, count);
});
test('núcleo indisponível durante pulso libera automaticamente o botão', t => {
  const { events, down, deactivate } = setup(t);
  down('ShiftLeft'); down('KeyZ', { shiftKey: true }); deactivate(); t.mock.timers.tick(50);
  assert.deepEqual(events.at(-1), ['y', false, 1]);
  const count = events.length; t.mock.timers.tick(500); assert.equal(events.length, count);
});
test('touch normal no mesmo botão não é solto pela fase desligada do turbo', t => {
  const { input, events, down, up } = setup(t);
  down('ShiftLeft'); down('KeyZ', { shiftKey: true }); input.touchInput('y', true, 1);
  t.mock.timers.tick(50); assert.deepEqual(events, [['y', true, 1]]);
  up('KeyZ'); assert.deepEqual(events, [['y', true, 1]]);
  input.touchInput('y', false, 1); assert.deepEqual(events.at(-1), ['y', false, 1]);
});
