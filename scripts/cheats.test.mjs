import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@vue/compiler-sfc';
import * as Cheats from '../src/helpers/Cheats.mjs';
import * as Dialog from '../src/helpers/CheatsDialog.mjs';

const consoles = JSON.parse(readFileSync(new URL('../src/json/consoles.json', import.meta.url), 'utf8'));
const free = consoles[0].cheats.formats.find(format => format.id === 'free');
function entry(overrides = {}) {
  return { id: '1', code: 'ABCD-EFGH', description: 'Vidas', enabled: true, format: 'free', ...overrides };
}
function emulator() {
  let allocated = 0, codes = [], active = [];
  const memory = new Map(), freed = [];
  const module = {
    stringToNewUTF8(text) { memory.set(++allocated, text); return allocated; },
    _free(pointer) { freed.push(pointer); },
    _cmd_cheat_realloc(size) { codes = Array(size).fill(null); },
    _cmd_cheat_set_code(index, pointer) { codes[index] = memory.get(pointer); },
    _cmd_cheat_apply_cheats() { active = codes.filter(Boolean); },
  };
  return { module, freed, get active() { return active; }, getEmscriptenModule: () => module };
}
function storage() {
  const values = new Map();
  return { values, get: key => values.get(key), set: (key, value) => values.set(key, value) };
}
test('novo cheat inicia marcado e armazenamento separa console e jogo', () => {
  const created = Cheats.newEntry('12345678 1234\n87654321 4321', '  Código composto  ', free);
  assert.equal(created.enabled, true); assert.equal(created.description, 'Código composto');
  const store = storage(), instance = emulator();
  Cheats.commit(store, instance, 'gba', 'a', [], [created]);
  assert.deepEqual(Cheats.read(store, 'gba', 'a'), [created]);
  assert.deepEqual(Cheats.read(store, 'gba', 'b'), []);
  assert.deepEqual(Cheats.read(store, 'nes', 'a'), []);
  assert.deepEqual(instance.active, ['12345678 1234+87654321 4321']);
});
test('reaplica apenas os marcados e desativar o último limpa os cheats do núcleo', () => {
  const instance = emulator();
  Cheats.apply(instance, [entry(), entry({ id: '2', code: '12345678', enabled: false })]);
  assert.deepEqual(instance.active, ['ABCD-EFGH']);
  Cheats.apply(instance, [entry({ enabled: false })]);
  assert.deepEqual(instance.active, []);
  assert.equal(instance.freed.length, 1);
});
test('falha de storage restaura núcleo e mantém lista anterior persistida', () => {
  const instance = emulator(), store = storage();
  const old = [entry()]; Cheats.commit(store, instance, 'nes', 'a', [], old);
  store.set = () => { throw new DOMException('quota', 'QuotaExceededError'); };
  assert.throws(() => Cheats.commit(store, instance, 'nes', 'a', old, [entry({ enabled: false })]), /anterior foi mantida/);
  assert.deepEqual(instance.active, ['ABCD-EFGH']);
  assert.deepEqual(Cheats.read(store, 'nes', 'a'), old);
});
test('dados corrompidos não são substituídos e alterações inválidas não chegam ao núcleo', () => {
  const store = storage(); store.values.set('cheats.nes.a', '{');
  assert.throws(() => Cheats.read(store, 'nes', 'a'), /preservados/);
  assert.equal(store.values.get('cheats.nes.a'), '{');
  assert.throws(() => Cheats.validate([entry({ enabled: 'yes' })]), /inválidos/);
  assert.throws(() => Cheats.validate([entry(), entry()]), /inválidos/);
  assert.throws(() => Cheats.newEntry('a'.repeat(241), 'Longo', free), /240/);
  assert.throws(() => Cheats.newEntry('code', '', free), /descrição/);
});
test('máscaras do JSON aceitam todos os formatos configurados, sem cortar colagens', () => {
  for (const console of consoles) for (const format of console.cheats.formats) {
    for (const mask of format.masks) {
      const raw = format.characters[0].repeat([...mask].filter(char => char === 'X').length);
      const result = Cheats.codeForFormat(raw.toLowerCase(), format);
      assert.ok(format.masks.some(candidate => candidate === result.replaceAll(format.characters[0], 'X')));
    }
  }
  const snes = consoles.find(console => console.id === 'snes').cheats.formats.find(format => format.id === 'game_genie');
  assert.equal(Cheats.formatCode('c2b4 6d07', snes), 'c2b4 6d07');
  assert.equal(Cheats.formatCode('c2b46d07', snes), 'C2B4-6D07');
  assert.equal(Cheats.formatCode('123456789', snes), '123456789');
  assert.throws(() => Cheats.codeForFormat('123', snes), /Livre/);
  assert.equal(Cheats.codeForFormat('custom+code', free), 'custom+code');
});
test('falhas de aplicação liberam strings e núcleo incompatível não informa sucesso', () => {
  const instance = emulator();
  instance.module._cmd_cheat_set_code = () => { throw new Error('falha'); };
  assert.throws(() => Cheats.apply(instance, [entry()]), /falha/);
  assert.equal(instance.freed.length, 1);
  assert.throws(() => Cheats.apply({ getEmscriptenModule: () => ({}) }, []), /núcleo/);
});
test('resolução fixa JS e WASM na mesma versão do RetroArch com exports de cheats', () => {
  for (const core of ['fceumm', 'snes9x', 'mgba', 'genesis_plus_gx']) {
    for (const extension of ['js', 'wasm']) assert.ok(Cheats.coreUrl(core, extension).includes('@v1.21.0/'));
  }
});

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.events = {}; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  addEventListener(name, callback) { this.events[name] = callback; }
  setAttribute(name, value) { this[name] = value; }
  focus() {}
  dispatch(type) { this.events[type]?.({ preventDefault() {} }); }
}
test('modal adiciona marcado, exibe texto seguro, alterna checkbox e recupera falha', async t => {
  const original = globalThis.document;
  globalThis.document = { createElement: tag => new Element(tag) };
  t.after(() => { if (original) globalThis.document = original; else delete globalThis.document; });
  let config, saved = [], message;
  const swal = { fire: async options => { config = options; }, resetValidationMessage() {}, showValidationMessage: text => { message = text; } };
  let fail = false;
  await Dialog.open(swal, { profile: { formats: [free], default_format: 'free' }, entries: [], active: () => true,
    onChange: next => { if (fail) throw new Error('quota'); saved = next; return next; } });
  const [form, list] = config.html.children;
  const code = form.children.find(child => child.id === 'cheat-code');
  const description = form.children.find(child => child.id === 'cheat-description');
  code.value = '1234'; description.value = '<img src=x onerror=alert(1)>';
  form.dispatch('submit');
  assert.equal(saved[0].enabled, true);
  assert.equal(list.children[0].children[1].children[0].textContent, '<img src=x onerror=alert(1)>');
  let checkbox = list.children[0].children[0]; checkbox.checked = false; checkbox.dispatch('change');
  assert.equal(saved[0].enabled, false);
  checkbox = list.children[0].children[0]; fail = true; checkbox.checked = true; checkbox.dispatch('change');
  assert.equal(checkbox.checked, false); assert.equal(message, 'quota');
  const remove = list.children[0].children.at(-1);
  assert.equal(remove.textContent, 'Remover'); assert.equal(remove.type, 'button');
  remove.dispatch('click');
  assert.equal(saved.length, 1); assert.equal(list.children[0].children[1].children[0].textContent, saved[0].description);
  fail = false; remove.dispatch('click');
  assert.deepEqual(saved, []);
  assert.equal(list.children[0].textContent, 'Nenhum cheat adicionado para este jogo.');
});

test('remover um cheat ativo atualiza núcleo e storage sem remover outros', () => {
  const store = storage(), instance = emulator();
  const previous = [entry(), entry({ id: '2', code: '12345678' })];
  Cheats.commit(store, instance, 'nes', 'a', [], previous);
  const next = Cheats.commit(store, instance, 'nes', 'a', previous, previous.filter(item => item.id !== '1'));
  assert.deepEqual(instance.active, ['12345678']);
  assert.deepEqual(Cheats.read(store, 'nes', 'a').map(item => item.id), ['2']);
  Cheats.commit(store, instance, 'nes', 'a', next, []);
  assert.deepEqual(instance.active, []); assert.deepEqual(Cheats.read(store, 'nes', 'a'), []);
});

function component({ store, instance, dialog, swal = {}, stateService = {} }) {
  const script = parse(readFileSync(new URL('../src/components/Game.vue', import.meta.url), 'utf8')).descriptor.script.content
    .replace(/^import .*;\s*$/gm, '').replace('TouchControls,', '').replace('export default', 'return');
  const options = new Function('Key', 'Cheats', 'CheatsDialog', 'consoles', 'Storage', 'Swal', 'EmulatorState', script)({}, Cheats, dialog, consoles, store, swal, stateService);
  const vm = { ...options.data(), console: 'nes', id: 'a', nostalgist: instance, $refs: { emulator: {} } };
  for (const [key, method] of Object.entries(options.methods)) vm[key] = method.bind(vm);
  return vm;
}
test('abrir modal pausa, bloqueia retomada no fundo e restaura pausa anterior', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const store = storage(), instance = emulator(), events = [];
  instance.pause = () => events.push('pause'); instance.resume = () => events.push('resume');
  const vm = component({ store, instance, swal: {}, dialog: { open: async (_, config) => {
    assert.equal(vm.is_paused, true); assert.equal(await vm.play(), false);
    config.onChange([entry()]);
  } } });
  const pending = vm.openCheats(); t.mock.timers.tick(10); await pending;
  t.mock.timers.tick(10);
  assert.deepEqual(events, ['pause', 'resume']);
  assert.equal(Cheats.read(store, 'nes', 'a')[0].enabled, true);
  vm.is_paused = vm.playback_applied_paused = true; events.length = 0;
  const again = vm.openCheats(); t.mock.timers.tick(10); await again; t.mock.timers.tick(10);
  assert.deepEqual(events, []); assert.equal(vm.is_paused, true);
});
test('reabrir partida mantém cadastros, desmarca todos e não aplica códigos no boot', () => {
  const store = storage(), instance = emulator();
  store.set('cheats.nes.a', { version: 1, entries: [entry(), entry({ id: '2', enabled: false })] });
  const vm = component({ store, instance }); vm.restoreCheats();
  assert.deepEqual(instance.active, []); assert.equal(vm.cheat_entries.length, 2);
  assert.ok(vm.cheat_entries.every(entry => !entry.enabled));
  assert.ok(Cheats.read(store, 'nes', 'a').every(entry => !entry.enabled));
  assert.deepEqual(vm.cheat_entries.map(entry => entry.id), ['1', '2']);
});

test('reiniciar limpa núcleo e persiste checkboxes desmarcados antes de RESET', () => {
  const store = storage(), instance = emulator();
  const vm = component({ store, instance });
  vm.cheat_entries = Cheats.commit(store, instance, 'nes', 'a', [], [entry()]);
  let resets = 0;
  instance.sendCommand = command => {
    assert.equal(command, 'RESET'); assert.deepEqual(instance.active, []);
    assert.equal(Cheats.read(store, 'nes', 'a')[0].enabled, false); resets++;
  };
  vm.restart(); assert.equal(resets, 1);
  assert.equal(vm.cheat_entries[0].enabled, false);
});

test('carregar/importar estado limpa cheats antes de restaurar o save', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const store = storage(), instance = emulator();
  let restored = 0;
  const vm = component({ store, instance, stateService: { restoreState: async (_, state) => {
    assert.equal(await state.text(), 'save'); assert.deepEqual(instance.active, []);
    assert.equal(Cheats.read(store, 'nes', 'a')[0].enabled, false); restored++;
  } } });
  vm.cheat_entries = Cheats.commit(store, instance, 'nes', 'a', [], [entry()]);
  const pending = vm.restoreCurrentState(instance, new Blob(['save']));
  t.mock.timers.tick(10); await pending; assert.equal(restored, 1);
});

test('falha ao persistir desativação interrompe reinício sem perder lista anterior', () => {
  const store = storage(), instance = emulator(), vm = component({ store, instance });
  vm.cheat_entries = Cheats.commit(store, instance, 'nes', 'a', [], [entry()]);
  store.set = () => { throw new Error('quota'); };
  let resets = 0, message;
  instance.sendCommand = () => resets++;
  vm.showError = text => { message = text; };
  assert.equal(vm.restart(), false); assert.equal(resets, 0);
  assert.match(message, /anterior foi mantida/);
  assert.equal(Cheats.read(store, 'nes', 'a')[0].enabled, true);
});
