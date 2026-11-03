import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@vue/compiler-sfc';
const source = parse(readFileSync(new URL('../src/components/Game.vue', import.meta.url), 'utf8')).descriptor.script.content.replace(/^import .*;\s*$/gm, '').replace('export default', 'const EmulatorState = { captureState: instance => instance.saveState(), restoreState: (instance, state) => instance.loadState(state) }; return');
const valid = 'data:application/octet-stream;base64,YQ==';
function setup(raw = JSON.stringify({ 0: valid })) {
  let stored = raw;
  const storage = { get: () => stored === null ? {} : JSON.parse(stored), set: (key, data) => { stored = JSON.stringify(data); } };
  const conversions = { blobToBase64: async () => valid, base64ToBlob: () => new Blob(['a']) };
  const options = new Function('Storage', 'Conversions', 'Screen', 'Key', 'Nostalgist', 'Swal', 'markRaw', source)(storage, conversions, {}, {}, {}, {}, x => x);
  const vm = { ...options.data(), console: 'nes', id: 'game', nostalgist: { saveState: async () => ({ state: new Blob(['a']) }), loadState: async () => {} } };
  for (const [name, fn] of Object.entries(options.methods)) vm[name] = fn.bind(vm);
  return { vm, storage, conversions, stored: () => stored };
}
test('confirma sucesso somente após gravar e preserva outros slots', async () => {
  const x = setup(JSON.stringify({ 1: valid }));
  await x.vm.saveState(0);
  assert.equal(x.vm.message, 'Salvo');
  assert.equal(JSON.parse(x.stored())[1], valid);
  assert.equal(x.vm.slot[0], valid);
});
test('quota não substitui save anterior nem informa sucesso', async () => {
  const x = setup(); const before = x.stored(); const slots = x.vm.slot;
  x.storage.set = () => { throw new DOMException('full', 'QuotaExceededError'); };
  await x.vm.saveState(0);
  assert.equal(x.stored(), before); assert.equal(x.vm.slot, slots);
  assert.equal(x.vm.message, null); assert.match(x.vm.save_error, /cheio/);
});
test('JSON e estrutura inválidos permanecem intactos e não são carregados', async () => {
  for (const raw of ['{', 'null', '[]', JSON.stringify({ 0: 123 }), JSON.stringify({ 0: 'bad' })]) {
    const x = setup(raw); let loaded = false;
    x.vm.nostalgist.loadState = async () => { loaded = true; };
    await x.vm.loadState(0); await x.vm.saveState(0);
    assert.equal(x.stored(), raw); assert.equal(loaded, false);
    assert.match(x.vm.save_error, /inválidos/);
  }
});
test('leitura bloqueada gera mensagem sem rejeição não tratada', async () => {
  const x = setup(); x.storage.get = () => { throw new DOMException('denied', 'SecurityError'); };
  await x.vm.loadState(0); assert.match(x.vm.save_error, /permite/);
});
test('falha do núcleo/conversão não mostra sucesso', async () => {
  const x = setup(); x.vm.nostalgist.loadState = async () => { throw new Error('core'); };
  await x.vm.loadState(0); assert.equal(x.vm.message, null); assert.ok(x.vm.save_error);
  x.conversions.blobToBase64 = async () => { throw new Error('reader'); };
  await x.vm.saveState(0); assert.equal(x.vm.message, null); assert.equal(x.vm.save_busy, false);
});
test('slot vazio não é erro e operação tardia não grava após fechar', async () => {
  const x = setup(null); await x.vm.loadState(0); assert.equal(x.vm.message, 'Nada a ser carregado');
  let finish; x.vm.nostalgist.saveState = () => new Promise(resolve => { finish = resolve; });
  const pending = x.vm.saveState(0); await x.vm.saveState(0);
  x.vm.session_closed = true; finish({ state: new Blob(['a']) }); await pending;
  assert.equal(x.stored(), null);
});
