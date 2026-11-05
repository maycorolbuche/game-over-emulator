import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@vue/compiler-sfc';
import { markRaw } from 'vue';
import * as Controls from '../src/helpers/Controls.mjs';
import * as Cheats from '../src/helpers/Cheats.mjs';
import * as RetroArchCommands from '../src/helpers/RetroArchCommands.mjs';
import * as StateFiles from '../src/helpers/EmulatorState.mjs';

// Execute the real component methods, replacing only browser/emulator services.
function setup(launch, swal = {}) {
  const source = readFileSync(new URL('../src/components/Game.vue', import.meta.url), 'utf8');
  const { descriptor } = parse(source);
  const script = descriptor.script.content.replace(/^import .*;\s*$/gm, '').replace('TouchControls,', '').replace('export default', 'const EmulatorState = { captureState: instance => instance.saveState(), restoreState: (instance, state) => instance.loadState(state) }; return');
  const options = new Function('Nostalgist', 'Swal', 'Storage', 'Conversions', 'Screen', 'Key', 'markRaw', 'Controls', 'Cheats', 'RetroArchCommands', script)(
    { launch }, { isVisible: () => false, ...swal }, { get: () => null }, {}, {}, {}, markRaw, Controls, Cheats, RetroArchCommands,
  );
  const canvas = {};
  const vm = { ...options.data(), filename: 'game.zip', console: 'nes', retroarch_controls: {}, $refs: { emulatorCanvas: canvas } };
  for (const [name, method] of Object.entries(options.methods)) vm[name] = method.bind(vm);
  Object.defineProperty(vm, 'game_controls', { get: options.computed.game_controls.bind(vm) });
  vm.interact = false;
  return vm;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('launch aguarda layout e fornece tamanho positivo mesmo com offset 0 durante loading', async () => {
  const layout = deferred();
  let calls = 0;
  const vm = setup(config => {
    calls++;
    assert.equal(vm.loading, true);
    assert.deepEqual(config.size, { width: 320, height: 240 });
    return instance();
  });
  vm.$refs.emulatorCanvas.offsetWidth = 0;
  vm.$refs.emulatorCanvas.offsetHeight = 0;
  vm.$nextTick = () => layout.promise;
  const pending = vm.launchGame();
  assert.equal(calls, 0);
  layout.resolve(); await pending;
  assert.equal(calls, 1); assert.equal(vm.loading, false);
  const template = parse(readFileSync(new URL('../src/components/Game.vue', import.meta.url), 'utf8')).descriptor.template.content;
  assert.match(template, /v-show="!interact && !launch_error"/);
  assert.match(template, /visibility: loading \? 'hidden' : 'visible'/);
});

test('launch usa o tamanho calculado do layout em vez dos atributos do buffer', async () => {
  const vm = setup(config => {
    assert.deepEqual(config.size, { width: 520, height: 390 }); return instance();
  });
  vm.handleResize = () => ({ width: 520, height: 390 });
  await vm.launchGame();
});

test('fechar enquanto aguarda layout impede iniciar um núcleo novo', async () => {
  const layout = deferred(); let calls = 0;
  const vm = setup(() => { calls++; return instance(); });
  vm.$nextTick = () => layout.promise;
  const pending = vm.launchGame(); vm.disposeGame(); layout.resolve(); await pending;
  assert.equal(calls, 0); assert.equal(vm.nostalgist, null);
});
function instance() {
  const emulator = { sendCommand() {} };
  return { getEmulator: () => emulator, getEmscriptenModule: () => ({}), exits: 0, exit(options) { assert.equal(options.removeCanvas, false); this.exits++; } };
}

// Model RetroArch 1.21 deliberately never consumes Nostalgist 0.10's stdin queue.
function modernCore() {
  const stdin = [], messages = [], files = new Map();
  let paused = false, loaded;
  const root = '/home/web_user/retroarch/userdata/states';
  const path = root + '/rom.state';
  const module = {
    _cmd_toggle_pause() { paused = !paused; },
    _cmd_save_state() { files.set(path, new Uint8Array([1, 2, 3])); },
    _cmd_load_state() { loaded = [...files.get(path)]; },
    EmscriptenSendCommand(command) { messages.push(command); },
  };
  const emulator = {
    status: 'running',
    sendCommand(command) { stdin.push(command); },
    pause() { if (this.status === 'running') this.sendCommand('PAUSE_TOGGLE'); this.status = 'paused'; },
    resume() { if (this.status === 'paused') this.sendCommand('PAUSE_TOGGLE'); this.status = 'running'; },
  };
  const fs = {
    analyzePath: directory => ({ exists: directory === root }),
    readdir: () => ['.', '..', ...[...files.keys()].map(path => path.split('/').at(-1))],
    stat: path => ({ mode: 0, size: files.get(path).length }), isDir: () => false,
    unlink: path => files.delete(path), readFile: path => files.get(path),
    writeFile: (path, bytes) => files.set(path, bytes),
  };
  const instance = {
    getEmulator: () => emulator, getEmscriptenModule: () => module, getEmscriptenFS: () => fs,
    sendCommand: command => emulator.sendCommand(command),
    pause: () => emulator.pause(), resume: () => emulator.resume(), exit() {},
  };
  return { instance, stdin, messages, module, get paused() { return paused; }, get loaded() { return loaded; } };
}

test('regressão: stdin antigo não pausa nem gera save no núcleo moderno', async () => {
  const core = modernCore();
  core.instance.pause();
  assert.equal(core.paused, false);
  await assert.rejects(StateFiles.captureState(core.instance, { attempts: 2, delay: async () => {} }), /não gerou/);
  assert.deepEqual(core.stdin, ['PAUSE_TOGGLE', 'SAVE_STATE']);
});

test('launch instala comunicação moderna para pause/resume sem alterar debounce', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const core = modernCore(); const vm = setup(() => core.instance);
  await vm.launchGame();
  vm.pause(); t.mock.timers.tick(9); assert.equal(core.paused, false);
  t.mock.timers.tick(1); assert.equal(core.paused, true);
  vm.play(); t.mock.timers.tick(10); assert.equal(core.paused, false);
  assert.deepEqual(core.stdin, []);
});

test('captura e restauração reais usam exports modernos para gerar e carregar bytes', async () => {
  const core = modernCore(); RetroArchCommands.connect(core.instance);
  const options = { attempts: 3, delay: async () => {} };
  const { state } = await StateFiles.captureState(core.instance, options);
  assert.deepEqual([...new Uint8Array(await state.arrayBuffer())], [1, 2, 3]);
  await StateFiles.restoreState(core.instance, new Blob([new Uint8Array([8, 9])]), options);
  assert.deepEqual(core.loaded, [8, 9]); assert.deepEqual(core.stdin, []);
});

test('rewind e aceleração usam EmscriptenSendCommand sem newline ou fila stdin', () => {
  const core = modernCore();
  RetroArchCommands.connect(core.instance); RetroArchCommands.connect(core.instance);
  core.instance.sendCommand('REWIND'); core.instance.sendCommand('REWIND');
  core.instance.sendCommand('FAST_FORWARD');
  assert.deepEqual(core.messages, ['REWIND', 'REWIND', 'FAST_FORWARD']);
  assert.deepEqual(core.stdin, []);
});

test('sem export direto usa transporte moderno, e módulos legados mantêm stdin', () => {
  const core = modernCore(); delete core.module._cmd_save_state;
  RetroArchCommands.connect(core.instance); core.instance.sendCommand('SAVE_STATE');
  assert.deepEqual(core.messages, ['SAVE_STATE']);
  const legacy = modernCore(); Object.keys(legacy.module).forEach(key => delete legacy.module[key]);
  RetroArchCommands.connect(legacy.instance); RetroArchCommands.connect(legacy.instance);
  legacy.instance.sendCommand('RESET'); assert.deepEqual(legacy.stdin, ['RESET']);
});

function rewind(t) {
  const { vm, commands } = playback(t);
  let sequence = 0;
  const frames = new Map();
  const oldRequest = globalThis.requestAnimationFrame;
  const oldCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = callback => {
    frames.set(++sequence, callback); return sequence;
  };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  t.after(() => {
    if (oldRequest) globalThis.requestAnimationFrame = oldRequest;
    else delete globalThis.requestAnimationFrame;
    if (oldCancel) globalThis.cancelAnimationFrame = oldCancel;
    else delete globalThis.cancelAnimationFrame;
  });
  return { vm, commands, frames, frame() {
    const [id, callback] = frames.entries().next().value;
    frames.delete(id); callback();
  } };
}

test('Backspace mantido envia REWIND por quadro e soltar cancela o loop', t => {
  const { vm, commands, frames, frame } = rewind(t);
  let prevented = 0;
  const event = { key: 'Backspace', preventDefault() { prevented++; }, stopImmediatePropagation() {} };
  vm.rewindKeyDown(event);
  vm.rewindKeyDown({ ...event, repeat: true });
  assert.deepEqual(commands, ['REWIND']);
  assert.equal(frames.size, 1);
  frame(); assert.deepEqual(commands, ['REWIND', 'REWIND']);
  vm.rewindKeyUp(event);
  assert.equal(frames.size, 0); assert.equal(vm.rewind_sources.size, 0);
  assert.equal(prevented, 2);
});

test('rewind de toque e teclado compartilham um loop sem soltar a outra origem', t => {
  const { vm, frames } = rewind(t);
  vm.touchInput('rewind', true); vm.rewindInput(true, 'keyboard');
  assert.equal(frames.size, 1);
  vm.touchInput('rewind', false); assert.equal(frames.size, 1);
  vm.rewindKeyUp({ key: 'Backspace' }); assert.equal(frames.size, 0);
});

test('rewind respeita pausa, menu, salvamento, sessão fechada e campos editáveis', t => {
  const { vm, commands, frames } = rewind(t);
  for (const flag of ['is_paused', 'playback_applied_paused', 'menu_open', 'save_busy', 'session_closed', 'loading']) {
    vm[flag] = true; vm.rewindInput(true, 'touch'); vm[flag] = false;
  }
  vm.rewindKeyDown({ key: 'Backspace', target: { closest: () => ({}) } });
  assert.deepEqual(commands, []); assert.equal(frames.size, 0);
  vm.rewindInput(true, 'touch'); vm.pause();
  assert.equal(frames.size, 0);
});

test('liberar entradas por foco/rotação e encerrar cancelam rewind pendente', t => {
  const { vm, frames } = rewind(t);
  vm.rewindInput(true, 'keyboard'); vm.releaseTouch(); assert.equal(frames.size, 0);
  vm.rewindInput(true, 'touch'); vm.disposeGame(); assert.equal(frames.size, 0);
});

test('atalho de rebobinar vem logo após Acelerar nos controles', () => {
  const vm = setup(() => {});
  const entries = Object.entries(vm.game_controls.emulator);
  const index = entries.findIndex(([name]) => name === 'accelerate');
  assert.deepEqual(entries[index + 1], ['rewind', 'BACKSPACE']);
});

function playback(t, paused = false) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const vm = setup(() => {});
  const commands = [];
  vm.nostalgist = {
    pause: () => commands.push('pause'),
    resume: () => commands.push('resume'),
    sendCommand: command => commands.push(command),
    exit() {},
  };
  vm.is_paused = vm.playback_applied_paused = paused;
  return { vm, commands };
}

test('pausado: play seguido de pause em menos de 10 ms não envia comandos', async t => {
  const { vm, commands } = playback(t, true);
  const first = vm.play();
  t.mock.timers.tick(5);
  const last = vm.pause();
  t.mock.timers.tick(9);
  assert.deepEqual(commands, []);
  assert.equal(vm.is_paused, true);
  t.mock.timers.tick(1);
  assert.deepEqual(commands, []);
  assert.equal(await first, true);
  assert.equal(await last, true);
});

test('rodando: pause seguido de play mantém execução sem alternar núcleo', t => {
  const { vm, commands } = playback(t);
  vm.pause(); vm.play(); t.mock.timers.tick(10);
  assert.deepEqual(commands, []);
  assert.equal(vm.is_paused, false);
});

test('último pedido vence e pedidos repetidos não duplicam comandos', t => {
  const { vm, commands } = playback(t);
  vm.pause(); vm.play(); vm.pause(); t.mock.timers.tick(10);
  assert.deepEqual(commands, ['pause']);
  vm.pause(); t.mock.timers.tick(10);
  assert.deepEqual(commands, ['pause']);
  vm.play(); t.mock.timers.tick(9); assert.deepEqual(commands, ['pause']);
  t.mock.timers.tick(1); assert.deepEqual(commands, ['pause', 'resume']);
});

test('fechamento cancela transição pendente e libera quem aguarda', async t => {
  const { vm, commands } = playback(t, true);
  const pending = vm.play(); vm.disposeGame(); t.mock.timers.tick(20);
  assert.equal(await pending, false);
  assert.deepEqual(commands, []);
});

test('reinício pausado aguarda 10 ms antes de retomar e enviar RESET', t => {
  const { vm, commands } = playback(t, true);
  vm.restart();
  assert.deepEqual(commands, []);
  t.mock.timers.tick(9);
  assert.deepEqual(commands, []);
  t.mock.timers.tick(1);
  assert.deepEqual(commands, ['resume', 'RESET']);
  assert.equal(vm.is_paused, false);
});

test('reinício pausado seguido de play adicional não duplica resume ou RESET', t => {
  const { vm, commands } = playback(t, true);
  vm.restart(); vm.play();
  assert.deepEqual(commands, []);
  t.mock.timers.tick(9);
  assert.deepEqual(commands, []);
  t.mock.timers.tick(1);
  assert.deepEqual(commands, ['RESET', 'resume']);
  t.mock.timers.tick(10);
  assert.deepEqual(commands, ['RESET', 'resume']);
});

test('reinício em execução envia RESET imediatamente sem retomar novamente', t => {
  const { vm, commands } = playback(t);
  vm.restart();
  assert.deepEqual(commands, ['RESET']);
  t.mock.timers.tick(10);
  assert.deepEqual(commands, ['RESET']);
});

test('ação de confirmação no menu não retoma jogo pausado entre pedidos', t => {
  const { vm, commands } = playback(t);
  vm.mobile_layout = true;
  vm.toggleMenu(); t.mock.timers.tick(10);
  vm.runMenuAction(() => vm.pause()); t.mock.timers.tick(10);
  assert.deepEqual(commands, ['pause']);
  assert.equal(vm.menu_open, false);
  assert.equal(vm.is_paused, true);
});

test('sucesso usa o canvas próprio e impede inicializações duplicadas', async () => {
  const pending = deferred();
  let calls = 0;
  const vm = setup(config => {
    calls++; assert.equal(config.element, vm.$refs.emulatorCanvas);
    assert.equal(config.retroarchConfig.rewind_enable, true);
    assert.equal(config.retroarchConfig.rewind_buffer_size, 20);
    assert.equal(config.retroarchConfig.rewind_granularity, 1);
    assert.equal(config.retroarchConfig.input_rewind, 'nul');
    return pending.promise;
  });
  const first = vm.launchGame();
  assert.equal(vm.loading, true);
  await vm.launchGame();
  const emulator = instance();
  pending.resolve(emulator);
  await first;
  assert.equal(vm.loading, false);
  assert.equal(vm.nostalgist, emulator);
  await vm.launchGame();
  assert.equal(calls, 1);
  vm.disposeGame();
  vm.disposeGame();
  assert.equal(emulator.exits, 1);
  assert.equal(vm.nostalgist, null);
});

test('falha encerra carregamento e permite nova tentativa', async t => {
  t.mock.method(console, 'error', () => {});
  let calls = 0;
  const emulator = instance();
  const vm = setup(() => { if (++calls === 1) throw new Error('network'); return emulator; });
  await vm.launchGame();
  assert.equal(vm.loading, false);
  assert.equal(vm.nostalgist, null);
  assert.match(vm.launch_error, /Não foi possível/);
  await vm.launchGame();
  assert.equal(vm.launch_error, null);
  assert.equal(vm.nostalgist, emulator);
});

test('fechamento durante launch descarta e encerra a instância tardia', async () => {
  const pending = deferred();
  const vm = setup(() => pending.promise);
  const running = vm.launchGame();
  await Promise.resolve(); // layout flush completed; the core launch is pending
  vm.disposeGame();
  assert.equal(vm.launch_controller.signal.aborted, true);
  const emulator = instance();
  pending.resolve(emulator);
  await running;
  assert.equal(emulator.exits, 1);
  assert.equal(vm.nostalgist, null);
  assert.equal(vm.loading, false);
  await vm.launchGame();
  assert.equal(vm.nostalgist, null);
});

test('rejeição tardia não altera estado de componente fechado', async () => {
  const pending = deferred();
  const vm = setup(() => pending.promise);
  const running = vm.launchGame();
  await Promise.resolve();
  vm.disposeGame();
  pending.reject(new Error('network'));
  await running;
  assert.equal(vm.launch_error, null);
  assert.equal(vm.loading, false);
});

test('jogo novo permanece independente da inicialização anterior', async () => {
  const pending = deferred();
  const old = setup(() => pending.promise);
  const first = old.launchGame();
  await Promise.resolve();
  old.disposeGame();
  const current = instance();
  const next = setup(() => current);
  await next.launchGame();
  const stale = instance();
  pending.resolve(stale);
  await first;
  assert.equal(stale.exits, 1);
  assert.equal(current.exits, 0);
  assert.equal(next.nostalgist, current);
});

test('erros usam SweetAlert com texto seguro e opção de nova tentativa', async () => {
  const dialogs = [];
  const vm = setup(async () => instance(), { fire: async config => { dialogs.push(config); return { isConfirmed: true }; } });
  await vm.showError('<erro>', false);
  assert.equal(dialogs[0].icon, 'error');
  assert.equal(dialogs[0].text, '<erro>');
  assert.equal(dialogs[0].html, undefined);
  assert.equal(dialogs[0].confirmButtonText, 'Entendi');
  let retries = 0; vm.launchGame = () => { retries++; };
  await vm.showError('Falha', true);
  assert.equal(dialogs[1].confirmButtonText, 'Tentar novamente');
  assert.equal(retries, 1);
});

test('fechar diálogo de inicialização encerra jogo e retorno tardio não reabre sessão', async () => {
  const pending = deferred();
  const vm = setup(() => {}, { fire: () => pending.promise });
  let closed = 0; vm.$emit = () => { closed++; };
  const result = vm.showError('erro', true);
  vm.disposeGame(); pending.resolve({ isConfirmed: true }); await result;
  assert.equal(closed, 0);
  const next = setup(() => {}, { fire: async () => ({ isConfirmed: false }) });
  next.$emit = () => { closed++; }; await next.showError('erro', true);
  assert.equal(next.session_closed, true); assert.equal(closed, 1);
});
