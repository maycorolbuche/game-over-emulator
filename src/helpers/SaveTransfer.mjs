const MAX_BYTES = 64 * 1024 * 1024;
const fail = message => { throw new Error(message); };
const hash = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');

export async function gameIdentity(instance, consoleId, gameId) {
  const options = instance.getEmulatorOptions();
  const roms = await Promise.all(options.rom.map(async rom => hash(await rom.fileContent.arrayBuffer())));
  return { console: consoleId, game: gameId, roms, core: options.core.name, coreHash: await hash(options.core.wasm) };
}

export async function exportState(state, identity) {
  if (!state.size || state.size > MAX_BYTES) fail('O estado do jogo está vazio ou excede o limite de 64 MB.');
  const bytes = new Uint8Array(await state.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return JSON.stringify({ format: 'game-over-state', version: 1, identity, state: btoa(binary), sha256: await hash(bytes) });
}

export async function importState(file, identity) {
  if (file.size > MAX_BYTES * 1.4) fail('O arquivo excede o limite de importação.');
  let data;
  try { data = JSON.parse(await file.text()); } catch { fail('O arquivo não contém um save JSON válido.'); }
  if (!data || data.format !== 'game-over-state' || data.version !== 1) fail('Formato ou versão de save não suportado.');
  const other = data.identity;
  if (!other || other.console !== identity.console || other.game !== identity.game || !Array.isArray(other.roms) || JSON.stringify(other.roms) !== JSON.stringify(identity.roms)) fail('Este save pertence a outro jogo ou a uma ROM diferente.');
  if (other.core !== identity.core || other.coreHash !== identity.coreHash) fail('Este save foi criado com outro núcleo ou versão do emulador.');
  if (typeof data.state !== 'string' || !data.state.length || data.state.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data.state)) fail('Os dados do save estão corrompidos.');
  let binary;
  try { binary = atob(data.state); } catch { fail('Os dados do save estão corrompidos.'); }
  if (!binary.length || binary.length > MAX_BYTES || btoa(binary) !== data.state) fail('Os dados do save são inválidos.');
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  if (await hash(bytes) !== data.sha256) fail('O arquivo está corrompido: a verificação de integridade falhou.');
  return new Blob([bytes], { type: 'application/octet-stream' });
}
