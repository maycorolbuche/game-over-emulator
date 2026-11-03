import test from 'node:test';
import assert from 'node:assert/strict';
import { captureState, restoreState } from '../src/helpers/EmulatorState.mjs';
const root = '/home/web_user/retroarch/userdata/states';
function fixture(path = root + '/FCEUmm/Inner ROM.state') {
  const entries = new Map();
  const commands = [];
  const fs = {
    analyzePath: p => ({ exists: p === root || p === root + '/FCEUmm' || entries.has(p) }),
    readdir: p => p === root ? ['.', '..', 'FCEUmm'] : ['.', '..', ...[...entries.keys()].map(x => x.split('/').at(-1))],
    stat: p => ({ mode: p.endsWith('FCEUmm') ? 1 : 0, size: entries.get(p)?.length || 0 }),
    isDir: mode => mode === 1,
    readFile: p => { if (!entries.has(p)) throw new Error('ENOENT'); return entries.get(p); },
    writeFile: (p, data) => entries.set(p, data),
    unlink: p => entries.delete(p),
  };
  let pending = false;
  const instance = { getEmscriptenFS: () => fs, sendCommand: command => { commands.push(command); if (command === 'SAVE_STATE') pending = true; } };
  const delay = async () => { if (pending) { entries.set(path, new Uint8Array([1, 2, 3])); pending = false; } };
  return { instance, fs, entries, commands, delay, path };
}
test('ZIP com nome externo diferente captura arquivo interno sem leituras inexistentes', async () => {
  const x = fixture();
  x.entries.set(root + '/FCEUmm/old.state', new Uint8Array([9]));
  const result = await captureState(x.instance, { delay: x.delay });
  assert.equal(result.path, x.path);
  assert.deepEqual([...new Uint8Array(await result.state.arrayBuffer())], [1, 2, 3]);
  assert.deepEqual(x.commands, ['SAVE_STATE']);
});
test('restauração escreve no caminho descoberto antes de LOAD_STATE', async () => {
  const x = fixture();
  await restoreState(x.instance, new Blob([new Uint8Array([7, 8])]), { delay: x.delay });
  assert.deepEqual([...x.entries.get(x.path)], [7, 8]);
  assert.deepEqual(x.commands, ['SAVE_STATE', 'LOAD_STATE']);
});
test('sem arquivo termina com erro limitado e sessão fechada cancela', async () => {
  const x = fixture();
  await assert.rejects(captureState(x.instance, { attempts: 2, delay: async () => {} }), /não gerou/);
  await assert.rejects(captureState(x.instance, { active: () => false, delay: x.delay }), /encerrada/);
});
