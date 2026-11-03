import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@vue/compiler-sfc';
import { markRaw } from 'vue';

// Execute the real component methods, replacing only browser/emulator services.
function setup(launch) {
  const source = readFileSync(new URL('../src/components/Game.vue', import.meta.url), 'utf8');
  const { descriptor } = parse(source);
  const script = descriptor.script.content.replace(/^import .*;\s*$/gm, '').replace('export default', 'const EmulatorState = { captureState: instance => instance.saveState(), restoreState: (instance, state) => instance.loadState(state) }; return');
  const options = new Function('Nostalgist', 'Swal', 'Storage', 'Conversions', 'Screen', 'Key', 'markRaw', script)(
    { launch }, {}, {}, {}, {}, {}, markRaw,
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
