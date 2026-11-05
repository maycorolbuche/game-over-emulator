export const CORE_VERSION = 'v1.21.0';
export function coreUrl(core, extension) {
  if (!['fceumm', 'snes9x', 'mgba', 'genesis_plus_gx'].includes(core) || !['js', 'wasm'].includes(extension))
    throw new Error('Núcleo de cheats não configurado.');
  return `https://cdn.jsdelivr.net/gh/arianrhodsandlot/retroarch-emscripten-build@${CORE_VERSION}/retroarch/${core}_libretro.${extension}`;
}
export const storageKey = (consoleId, gameId) => `cheats.${consoleId}.${gameId}`;
export function validate(entries) {
  if (!Array.isArray(entries) || entries.length > 100) throw new Error('A lista de cheats contém dados inválidos. Os dados foram preservados.');
  const ids = new Set();
  return entries.map(entry => {
    if (!entry || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id) ||
        typeof entry.code !== 'string' || !entry.code.trim() || entry.code.length > 240 || /[^\x20-\x7e\r\n\t]/.test(entry.code) ||
        typeof entry.description !== 'string' || !entry.description.trim() || entry.description.length > 160 ||
        typeof entry.enabled !== 'boolean' || typeof entry.format !== 'string')
      throw new Error('A lista de cheats contém dados inválidos. Os dados foram preservados.');
    ids.add(entry.id);
    return { id: entry.id, code: entry.code, description: entry.description, enabled: entry.enabled, format: entry.format };
  });
}
export function read(storage, consoleId, gameId) {
  const value = storage.get(storageKey(consoleId, gameId));
  if (value == null) return [];
  if (!value || value.version !== 1) throw new Error('Não foi possível ler os cheats deste jogo. Os dados foram preservados.');
  return validate(value.entries);
}
// A mask never truncates pasted data. Unknown input remains available in Livre.
export function formatCode(value, format) {
  if (!format?.masks?.length) return value;
  const upper = value.toUpperCase();
  const alphabet = format.characters || '';
  const separators = new Set(format.masks.join('').replaceAll('X', '').split(''));
  let raw = '';
  for (const char of upper) {
    if (alphabet.includes(char)) raw += char;
    else if (!separators.has(char)) return value;
  }
  const mask = format.masks.find(mask => mask.split('X').length - 1 >= raw.length);
  if (!mask) return value;
  let result = '', index = 0;
  for (const char of mask) {
    if (index === raw.length) break;
    result += char === 'X' ? raw[index++] : char;
  }
  return result;
}
export function codeForFormat(value, format) {
  const code = formatCode(value.trim(), format);
  if (!code || code.length > 240 || /[^\x20-\x7e\r\n\t]/.test(code))
    throw new Error('Informe um código de até 240 caracteres, usando letras, números e os separadores do código.');
  if (format?.masks?.length) {
    const matches = format.masks.some(mask => mask.length === code.length && [...mask].every((char, i) =>
      char === 'X' ? format.characters.includes(code[i]) : code[i] === char));
    if (!matches) throw new Error('O código não corresponde ao formato escolhido. Confira a máscara ou selecione Livre.');
  }
  return code;
}
export function newEntry(code, description, format) {
  if (!description.trim() || description.trim().length > 160) throw new Error('Informe uma descrição de até 160 caracteres.');
  return { id: crypto.randomUUID(), code: codeForFormat(code, format), description: description.trim(), enabled: true, format: format?.id || 'free' };
}
export function supported(instance) {
  const module = instance.getEmscriptenModule();
  return ['_cmd_cheat_realloc', '_cmd_cheat_set_code', '_cmd_cheat_apply_cheats', 'stringToNewUTF8', '_free']
    .every(key => typeof module[key] === 'function');
}
export function apply(instance, entries) {
  const list = validate(entries).filter(entry => entry.enabled);
  if (!supported(instance)) throw new Error('Este núcleo não oferece a aplicação de cheats. Reabra o jogo com a versão atualizada.');
  const module = instance.getEmscriptenModule();
  // Allocate strings before clearing the current list, then free every allocation.
  const pointers = [];
  try {
    for (const { code } of list) {
      const pointer = module.stringToNewUTF8(code.replace(/\r?\n/g, '+'));
      if (!pointer) throw new Error('Não há memória disponível para aplicar os cheats.');
      pointers.push(pointer);
    }
    module._cmd_cheat_realloc(0);
    // Applying an empty list returns early in RetroArch: one blank slot resets the core.
    module._cmd_cheat_realloc(Math.max(list.length, 1));
    pointers.forEach((pointer, index) => module._cmd_cheat_set_code(index, pointer));
    module._cmd_cheat_apply_cheats();
    if (!list.length) module._cmd_cheat_realloc(0);
  } finally {
    pointers.forEach(pointer => module._free(pointer));
  }
}
export function commit(storage, instance, consoleId, gameId, previous, next) {
  const entries = validate(next);
  try {
    apply(instance, entries);
    storage.set(storageKey(consoleId, gameId), { version: 1, entries });
  } catch (error) {
    try { apply(instance, previous); }
    catch { throw new Error('Não foi possível concluir a alteração nem restaurar os cheats ativos. Reabra o jogo para recuperar a lista salva.'); }
    throw new Error(`Não foi possível atualizar os cheats. A lista anterior foi mantida. ${error.message || ''}`);
  }
  return entries;
}
