import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@vue/compiler-sfc';
import * as transfer from '../src/helpers/SaveTransfer.mjs';
const identity = { console: 'nes', game: 'game', roms: ['romhash'], core: 'fceumm', coreHash: 'corehash' };
const file = json => new Blob([json], { type: 'application/json' });

test('exporta estado atual e importa os mesmos bytes', async () => {
  const json = await transfer.exportState(new Blob(['fase 3']), identity);
  const state = await transfer.importState(file(json), identity);
  assert.equal(await state.text(), 'fase 3');
});
test('rejeita ROM diferente, núcleo diferente, versão e corrupção', async () => {
  const json = await transfer.exportState(new Blob(['fase 3']), identity);
  for (const mutate of [d => { d.identity.roms = ['other']; }, d => { d.identity.coreHash = 'other'; }, d => { d.version = 9; }, d => { d.state = btoa('corrompido'); }, d => { d.state = '?'; }]) {
    const data = JSON.parse(json); mutate(data);
    await assert.rejects(transfer.importState(file(JSON.stringify(data)), identity));
  }
  await assert.rejects(transfer.importState(file('{'), identity));
});
test('identidade usa bytes reais da ROM e do núcleo', async () => {
  const instance = { getEmulatorOptions: () => ({ rom: [{ fileContent: new Blob(['rom']) }], core: { name: 'core', wasm: new Uint8Array([1, 2]).buffer } }) };
  const data = await transfer.gameIdentity(instance, 'nes', 'game');
  assert.match(data.roms[0], /^[a-f0-9]{64}$/);
  assert.match(data.coreHash, /^[a-f0-9]{64}$/);
});
function component(service) {
  const script = parse(readFileSync(new URL('../src/components/Game.vue', import.meta.url), 'utf8')).descriptor.script.content.replace(/^import .*;\s*$/gm, '').replace('TouchControls,', '').replace('export default', 'const EmulatorState = { captureState: instance => instance.saveState(), restoreState: (instance, state) => instance.loadState(state) }; return');
  const storage = { get() { throw new Error('storage não pode ser lido'); }, set() { throw new Error('storage não pode ser gravado'); } };
  const options = new Function('Storage', 'Conversions', 'Screen', 'Key', 'Nostalgist', 'Swal', 'markRaw', 'SaveTransfer', script)(storage, {}, {}, {}, {}, {}, x => x, service);
  const vm = { ...options.data(), console: 'nes', id: 'game' };
  for (const [name, fn] of Object.entries(options.methods)) vm[name] = fn.bind(vm);
  return vm;
}
test('importação carrega automaticamente sem ler/gravar slots locais', async () => {
  const json = await transfer.exportState(new Blob(['fase 3']), identity);
  const vm = component({ ...transfer, gameIdentity: async () => identity });
  let loaded;
  vm.nostalgist = { loadState: async blob => { loaded = await blob.text(); } };
  vm.slot = { 0: 'fase 1' };
  await vm.importSave({ target: { files: [file(json)], value: 'a' } });
  assert.equal(loaded, 'fase 3'); assert.equal(vm.slot[0], 'fase 1'); assert.equal(vm.save_error, null);
});
test('arquivo inválido não chama núcleo nem altera slots', async () => {
  const vm = component({ ...transfer, gameIdentity: async () => identity });
  let calls = 0; vm.nostalgist = { loadState: async () => { calls++; } };
  const slots = vm.slot;
  await vm.importSave({ target: { files: [file('{')], value: 'a' } });
  assert.equal(calls, 0); assert.equal(vm.slot, slots); assert.match(vm.save_error, /JSON/);
});
test('exportação captura núcleo atual e não toca no save local', async t => {
  let exported;
  const vm = component({ gameIdentity: async () => identity, exportState: async state => { exported = await state.text(); return '{}'; } });
  vm.is_paused = true;
  vm.playback_applied_paused = true;
  vm.nostalgist = { resume() {}, pause() {}, saveState: async () => ({ state: new Blob(['fase 3']) }) };
  vm.slot = { 0: 'fase 1' };
  t.mock.method(URL, 'createObjectURL', () => 'blob:mock');
  const old = globalThis.document;
  globalThis.document = { body: { append() {} }, createElement: () => ({ click() {}, remove() {} }) };
  try { await vm.exportSave(); } finally { if (old === undefined) delete globalThis.document; else globalThis.document = old; }
  assert.equal(exported, 'fase 3'); assert.equal(vm.slot[0], 'fase 1'); assert.equal(vm.save_error, null);
});

test('captura permite processar SAVE_STATE e restaura pausa mesmo em erro', async () => {
  const vm = component({});
  const calls = [];
  vm.is_paused = true;
  vm.playback_applied_paused = true;
  vm.nostalgist = { resume() { calls.push('resume'); }, pause() { calls.push('pause'); }, async saveState() { calls.push('save'); throw new Error('fs timeout'); } };
  await assert.rejects(vm.captureCurrentState(vm.nostalgist), /fs timeout/);
  assert.deepEqual(calls, ['resume', 'save', 'pause']);
  assert.equal(vm.is_paused, true);
});
