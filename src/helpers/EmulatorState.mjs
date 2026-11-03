const ROOT = '/home/web_user/retroarch/userdata/states';
const MAX_SIZE = 64 * 1024 * 1024;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function stateFiles(fs, directory = ROOT, depth = 0) {
  if (depth > 8 || !fs.analyzePath(directory).exists) return [];
  const files = [];
  for (const name of fs.readdir(directory)) {
    if (name === '.' || name === '..') continue;
    const path = directory + '/' + name;
    const stat = fs.stat(path);
    if (fs.isDir(stat.mode)) files.push(...stateFiles(fs, path, depth + 1));
    else if (/\.state(?:\d+)?$/.test(name)) files.push(path);
  }
  return files;
}

// Nostalgist 0.10 guesses a state filename from the ZIP name. RetroArch may
// instead use the inner ROM name. Discover the file created by SAVE_STATE.
export async function captureState(instance, { active = () => true, attempts = 100, delay = sleep } = {}) {
  const fs = instance.getEmscriptenFS();
  for (const path of stateFiles(fs)) fs.unlink(path);
  instance.sendCommand('SAVE_STATE');
  let previous;
  for (let i = 0; i < attempts; i++) {
    await delay(100);
    if (!active()) throw new Error('A sessão do jogo foi encerrada.');
    const files = stateFiles(fs);
    if (files.length > 1) throw new Error('O núcleo gerou múltiplos arquivos de estado; não foi possível identificar o save.');
    if (!files.length) continue;
    const path = files[0];
    const size = fs.stat(path).size;
    if (size > MAX_SIZE) throw new Error('O estado do jogo excede 64 MB.');
    if (!size) continue;
    const bytes = fs.readFile(path).slice();
    if (previous?.path === path && previous.bytes.length === bytes.length && bytes.every((value, index) => value === previous.bytes[index])) {
      return { state: new Blob([bytes], { type: 'application/octet-stream' }), path };
    }
    previous = { path, bytes };
  }
  throw new Error('O núcleo não gerou um arquivo de estado em até 10 segundos.');
}

export async function restoreState(instance, state, options) {
  // A fresh capture discovers the current core/ROM path, even on a session
  // that has never exported. Only the emulator's temporary FS is touched.
  const { path } = await captureState(instance, options);
  const bytes = new Uint8Array(await state.arrayBuffer());
  if (options?.active && !options.active()) throw new Error('A sessão do jogo foi encerrada.');
  instance.getEmscriptenFS().writeFile(path, bytes);
  instance.sendCommand('LOAD_STATE');
}
