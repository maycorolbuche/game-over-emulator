import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@vue/compiler-sfc';
import { markRaw } from 'vue';

// Execute the real component methods, replacing only browser/emulator services.
function setup(launch, swal = {}) {
  const source = readFileSync(new URL('../src/components/Game.vue', import.meta.url), 'utf8');
  const { descriptor } = parse(source);
  const script = descriptor.script.content.replace(/^import .*;\s*$/gm, '').replace('TouchControls,', '').replace('export default', 'const EmulatorState = { captureState: instance => instance.saveState(), restoreState: (instance, state) => instance.loadState(state) }; return');
  const options = new Function('Nostalgist', 'Swal', 'Storage', 'Conversions', 'Screen', 'Key', 'markRaw', script)(
    { launch }, { isVisible: () => false, ...swal }, {}, {}, {}, {}, markRaw,
  );
  const canvas = {};
  const vm = { ...options.data(), filename: 'game.zip', console: 'nes', retroarch_controls: {}, $refs: { emulatorCanvas: canvas } };
  for (const [name, method] of Object.entries(options.methods)) vm[name] = method.bind(vm);
  vm.interact = false;
  return vm;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function instance() {
  return { exits: 0, exit(options) { assert.equal(options.removeCanvas, false); this.exits++; } };
}

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

test('reinício não usa retomada imediata da biblioteca nem duplica resume', t => {
  const { vm, commands } = playback(t, true);
  vm.restart(); vm.play();
  assert.deepEqual(commands, ['RESET']);
  t.mock.timers.tick(10);
  assert.deepEqual(commands, ['RESET', 'resume']);
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
  const vm = setup(config => { calls++; assert.equal(config.element, vm.$refs.emulatorCanvas); return pending.promise; });
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
